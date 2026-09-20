import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  // Solo inserta una fila con la fecha de hoy. Sin usuario, sin IP, sin nota.
  const { error } = await supabase.from("practica_stats").insert({});

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
