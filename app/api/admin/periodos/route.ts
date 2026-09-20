import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (profile?.rol !== "admin") return null;
  return user;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { nombre, fechaInicio, fechaFin } = await request.json();
  if (!nombre || !fechaInicio || !fechaFin) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("periodos")
    .insert({ nombre, fecha_inicio: fechaInicio, fecha_fin: fechaFin, activo: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, periodo: data });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, activo } = await request.json();
  if (!id || typeof activo !== "boolean") {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.from("periodos").update({ activo }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
