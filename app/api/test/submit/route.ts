import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { periodoId, puntuacion, totalPreguntas, respuestas } = body;

  if (!periodoId || typeof puntuacion !== "number" || typeof totalPreguntas !== "number") {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Revalidamos que el periodo siga abierto en el momento del envío.
  const hoy = new Date().toISOString().slice(0, 10);
  const { data: periodo } = await supabase
    .from("periodos")
    .select("id")
    .eq("id", periodoId)
    .eq("activo", true)
    .lte("fecha_inicio", hoy)
    .gte("fecha_fin", hoy)
    .maybeSingle();

  if (!periodo) {
    return NextResponse.json({ error: "El periodo ya no está abierto." }, { status: 403 });
  }

  const { error } = await supabase.from("intentos").insert({
    usuario_id: user.id,
    periodo_id: periodoId,
    respuestas,
    puntuacion,
    total_preguntas: totalPreguntas
  });

  if (error) {
    // El código 23505 es "violación de restricción única": ya existía un intento.
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya has completado el test de este periodo." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
