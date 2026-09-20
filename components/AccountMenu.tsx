"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountMenu() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-4 text-sm mb-4">
      <a href="/mis-resultados" className="text-muted hover:text-white">
        Mis resultados
      </a>
      <a href="/cuenta" className="text-muted hover:text-white">
        Cambiar contraseña
      </a>
      <button onClick={cerrarSesion} disabled={saliendo} className="text-muted hover:text-white">
        {saliendo ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </div>
  );
}
