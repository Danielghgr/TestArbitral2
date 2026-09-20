import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NUM_PREGUNTAS_TEST = 25; // preguntas del test oficial

export async function GET() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: periodo } = await supabase
    .from("periodos")
    .select("id")
    .eq("activo", true)
    .lte("fecha_inicio", hoy)
    .gte("fecha_fin", hoy)
    .maybeSingle();

  if (!periodo) {
    return NextResponse.json({ error: "No hay ningún periodo de test abierto." }, { status: 403 });
  }

  const { data: intentoPrevio } = await supabase
    .from("intentos")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("periodo_id", periodo.id)
    .maybeSingle();

  if (intentoPrevio) {
    return NextResponse.json({ error: "Ya has completado el test de este periodo." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("preguntas")
    .select("id, enunciado, opcion1, opcion2, opcion3, correcta, explicacion");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shuffled = [...(data || [])].sort(() => Math.random() - 0.5).slice(0, NUM_PREGUNTAS_TEST);
  return NextResponse.json({ preguntas: shuffled });
}
