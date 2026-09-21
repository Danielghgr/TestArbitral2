import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ count: numArbitrosActivos }, { count: numResponsables }, { data: periodoActivo }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("rol", "usuario")
        .eq("activo", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("rol", "responsable"),
      supabase
        .from("periodos")
        .select("id, nombre, fecha_inicio, fecha_fin")
        .eq("activo", true)
        .lte("fecha_inicio", hoy)
        .gte("fecha_fin", hoy)
        .maybeSingle()
    ]);

  let numIntentosPeriodo: number | null = null;
  if (periodoActivo) {
    const { count } = await supabase
      .from("intentos")
      .select("*", { count: "exact", head: true })
      .eq("periodo_id", periodoActivo.id);
    numIntentosPeriodo = count ?? 0;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card">
        <p className="text-muted text-sm mb-1">Árbitros</p>
        <p className="text-3xl font-bold">{numArbitrosActivos ?? 0}</p>
      </div>
      <div className="card">
        <p className="text-muted text-sm mb-1">Responsables</p>
        <p className="text-3xl font-bold">{numResponsables ?? 0}</p>
      </div>
      <div className="card">
        <p className="text-muted text-sm mb-1">Periodo actual</p>
        {periodoActivo ? (
          <>
            <p className="text-lg font-semibold text-good">
              {periodoActivo.nombre}
              <br />
              <span className="text-sm text-muted font-normal">
                {periodoActivo.fecha_inicio} — {periodoActivo.fecha_fin}
              </span>
            </p>
            <p className="text-sm text-muted mt-2">
              <span className="text-white font-semibold">{numIntentosPeriodo}</span> árbitro
              {numIntentosPeriodo === 1 ? "" : "s"} ha{numIntentosPeriodo === 1 ? "" : "n"} hecho el
              test
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold text-muted">Sin periodo abierto</p>
        )}
      </div>
    </div>
  );
}
