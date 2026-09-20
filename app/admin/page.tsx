import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const supabase = createClient();

  const [{ count: numUsuarios }, { count: numActivos }, { data: periodoActivo }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("rol", "usuario"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("rol", "usuario")
      .eq("activo", true),
    supabase
      .from("periodos")
      .select("nombre, fecha_inicio, fecha_fin")
      .eq("activo", true)
      .lte("fecha_inicio", new Date().toISOString().slice(0, 10))
      .gte("fecha_fin", new Date().toISOString().slice(0, 10))
      .maybeSingle()
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card">
        <p className="text-muted text-sm mb-1">Usuarios totales</p>
        <p className="text-3xl font-bold">{numUsuarios ?? 0}</p>
      </div>
      <div className="card">
        <p className="text-muted text-sm mb-1">Usuarios activos</p>
        <p className="text-3xl font-bold">{numActivos ?? 0}</p>
      </div>
      <div className="card">
        <p className="text-muted text-sm mb-1">Periodo actual</p>
        {periodoActivo ? (
          <p className="text-lg font-semibold text-good">
            {periodoActivo.nombre}
            <br />
            <span className="text-sm text-muted font-normal">
              {periodoActivo.fecha_inicio} — {periodoActivo.fecha_fin}
            </span>
          </p>
        ) : (
          <p className="text-lg font-semibold text-muted">Sin periodo abierto</p>
        )}
      </div>
    </div>
  );
}
