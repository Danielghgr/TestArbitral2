import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Este endpoint lo llama únicamente el workflow programado de GitHub Actions
// (no lo usa nadie desde la interfaz), por eso se protege con un secreto en
// vez de con una sesión de usuario. Crea el periodo del mes actual, del día
// 1 al día 15, y no hace nada si ya existiera uno igual (para que ejecutarlo
// dos veces por error no duplique periodos).
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth() + 1; // 1-12
  const mesStr = String(mes).padStart(2, "0");

  const fechaInicio = `${anio}-${mesStr}-01`;
  const fechaFin = `${anio}-${mesStr}-15`;

  const nombresMes = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const nombre = `${nombresMes[mes - 1]} ${anio}`;

  const adminClient = createAdminClient();

  // Evita duplicados: si ya existe un periodo con esas mismas fechas, no crea otro.
  const { data: existente } = await adminClient
    .from("periodos")
    .select("id")
    .eq("fecha_inicio", fechaInicio)
    .eq("fecha_fin", fechaFin)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({ ok: true, creado: false, mensaje: "El periodo ya existía." });
  }

  const { data, error } = await adminClient
    .from("periodos")
    .insert({ nombre, fecha_inicio: fechaInicio, fecha_fin: fechaFin, activo: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, creado: true, periodo: data });
}
