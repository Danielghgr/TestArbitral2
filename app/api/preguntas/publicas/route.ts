import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_PREGUNTAS = 25;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let n = parseInt(searchParams.get("n") || "20", 10);
  if (isNaN(n) || n < 1) n = 1;
  if (n > MAX_PREGUNTAS) n = MAX_PREGUNTAS;

  const supabase = createClient();

  // Traemos todo el banco (solo id + contenido, nunca datos sensibles) y
  // barajamos en el servidor para no depender de random() de Postgres.
  const { data, error } = await supabase
    .from("preguntas")
    .select("id, enunciado, opcion1, opcion2, opcion3, correcta, explicacion");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shuffled = [...(data || [])].sort(() => Math.random() - 0.5).slice(0, n);
  return NextResponse.json({ preguntas: shuffled });
}
