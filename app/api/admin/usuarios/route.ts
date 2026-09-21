import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Comprueba que quien llama es un admin autenticado antes de usar la service_role key.
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

const CATEGORIAS = [
  "1ª Nacional",
  "1ª Autonómica",
  "Autonómico Grupo A",
  "Grupo de Tecnificación",
  "Autonómico Grupo B",
  "Autonómico Grupo C",
  "Autonómico Primer Año",
  "Escuela"
];

const ROLES = ["usuario", "responsable", "admin"];

// Crea un usuario nuevo (email + contraseña que decide el admin).
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { email, password, nombre, categoria, rol } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }
  if (categoria && !CATEGORIAS.includes(categoria)) {
    return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
  }
  if (rol && !ROLES.includes(rol)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no requiere que el usuario confirme el email
    user_metadata: { nombre: nombre || email }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // El trigger de la base de datos ya crea la fila en profiles (con rol
  // "usuario" por defecto); aquí rellenamos categoría y/o rol si se
  // indicaron. Usamos el cliente admin porque la tabla profiles no tiene
  // policy de UPDATE para el cliente normal (por diseño).
  const cambiosIniciales: Record<string, unknown> = {};
  if (categoria) cambiosIniciales.categoria = categoria;
  if (rol && rol !== "usuario") cambiosIniciales.rol = rol;

  if (Object.keys(cambiosIniciales).length > 0 && data.user) {
    await adminClient.from("profiles").update(cambiosIniciales).eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true, id: data.user?.id });
}

// Actualiza campos del perfil: activo, categoría y/o rol.
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, activo, categoria, rol } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Falta el id del usuario" }, { status: 400 });
  }
  if (categoria !== undefined && categoria !== null && !CATEGORIAS.includes(categoria)) {
    return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
  }
  if (rol !== undefined && !ROLES.includes(rol)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }

  const cambios: Record<string, unknown> = {};
  if (typeof activo === "boolean") cambios.activo = activo;
  if (categoria !== undefined) cambios.categoria = categoria;
  if (rol !== undefined) cambios.rol = rol;

  // Igual que en el alta: profiles no tiene policy de UPDATE para el cliente
  // normal, así que usamos el cliente admin (ya verificamos arriba que quien
  // llama es un admin autenticado).
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("profiles").update(cambios).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
