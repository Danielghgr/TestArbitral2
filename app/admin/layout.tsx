import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AccountMenu from "@/components/AccountMenu";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const esAdmin = profile?.rol === "admin";
  const esResponsable = profile?.rol === "responsable";
  if (!esAdmin && !esResponsable) redirect("/test");

  return (
    <div>
      <AccountMenu mostrarMisResultados={false} />
      <header className="mb-6">
        <h1 className="text-xl font-bold mb-3">
          {esAdmin ? "Panel de administración" : "Resultados"}
        </h1>
        {esAdmin && (
          <nav className="flex flex-wrap gap-2 text-sm">
            <a href="/admin" className="btn-secondary !w-auto px-4">
              Resumen
            </a>
            <a href="/admin/usuarios" className="btn-secondary !w-auto px-4">
              Usuarios
            </a>
            <a href="/admin/periodos" className="btn-secondary !w-auto px-4">
              Periodos
            </a>
            <a href="/admin/resultados" className="btn-secondary !w-auto px-4">
              Resultados
            </a>
            <a href="/admin/practica" className="btn-secondary !w-auto px-4">
              Uso de práctica
            </a>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}
