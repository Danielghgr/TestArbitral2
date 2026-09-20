import { createClient } from "@/lib/supabase/server";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, email, nombre, categoria, rol, activo, created_at")
    .order("created_at", { ascending: false });

  return <UsuariosClient usuariosIniciales={usuarios || []} />;
}
