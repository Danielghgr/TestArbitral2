import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CambiarPasswordForm from "./CambiarPasswordForm";

export default async function CuentaPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-bold mb-1 text-center">Mi cuenta</h1>
      <p className="text-muted text-sm text-center mb-6">{user.email}</p>
      <CambiarPasswordForm />
      <a href="/test" className="block text-center text-sm text-muted mt-6 hover:text-white">
        ← Volver al test
      </a>
    </div>
  );
}
