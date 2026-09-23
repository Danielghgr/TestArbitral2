"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nickToEmail } from "@/lib/nick";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/test";

  // Evita el error de hidratación: el navegador (gestor de contraseñas nativo
  // de Chrome, autocompletado, etc.) puede tocar los inputs de NICK/contraseña
  // antes de que React termine de hidratar. Renderizando el formulario real
  // solo después del montaje, el HTML inicial del servidor y el primer render
  // del cliente son idénticos (un simple estado de carga), así que no hay nada
  // que comparar y el error desaparece.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError, data } = await supabase.auth.signInWithPassword({
      email: nickToEmail(nick),
      password
    });

    if (signInError) {
      setError("NICK o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Si el admin lo dio de baja, no le dejamos pasar aunque la contraseña sea correcta.
    const { data: profile } = await supabase
      .from("profiles")
      .select("activo, rol")
      .eq("id", data.user.id)
      .single();

    if (!profile?.activo) {
      await supabase.auth.signOut();
      setError("Tu usuario está dado de baja. Contacta con el administrador.");
      setLoading(false);
      return;
    }

    let destino = redirect;
    if (profile.rol === "admin") destino = "/admin";
    else if (profile.rol === "responsable") destino = "/admin/resultados";

    router.push(destino);
    router.refresh();
  }

  if (!mounted) {
    return (
      <div className="card max-w-sm mx-auto mt-16 text-center text-muted">
        Cargando...
      </div>
    );
  }

  return (
    <div className="card max-w-sm mx-auto mt-16">
      <img src="/logo.png" alt="FBM" className="w-20 mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-1 text-center">Test de Árbitros</h1>
      <p className="text-muted text-sm text-center mb-6">FBM · Federación Baloncesto Madrid</p>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" suppressHydrationWarning>
        <div>
          <label className="block text-sm text-muted mb-1">NICK</label>
          <input
            type="text"
            required
            className="input"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Contraseña</label>
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            suppressHydrationWarning
          />
        </div>

        {error && <p className="text-bad text-sm">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <a href="/practica" className="block text-center text-sm text-muted mt-6 hover:text-white">
        ¿Solo quieres practicar? Entra sin usuario →
      </a>
    </div>
  );
}
