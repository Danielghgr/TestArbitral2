import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CambiarPasswordForm from "./CambiarPasswordForm";

export default async function CuentaPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("nick, rol").eq("id", user.id).single();

  const volverHref =
    profile?.rol === "admin" ? "/admin" : profile?.rol === "responsable" ? "/admin/resultados" : "/test";
  const volverTexto = profile?.rol === "admin" || profile?.rol === "responsable" ? "← Volver al panel" : "← Volver al test";

  return (
    <div>
      <h1 className="text-xl font-bold mb-1 text-center">Mi cuenta</h1>
      <p className="text-muted text-sm text-center mb-6">{profile?.nick}</p>
      <CambiarPasswordForm />
      <a href={volverHref} className="block text-center text-sm text-muted mt-6 hover:text-white">
        {volverTexto}
      </a>
    </div>
  );
}
