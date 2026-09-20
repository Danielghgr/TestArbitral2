import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";

export default async function MisResultadosPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: intentos } = await supabase
    .from("intentos")
    .select("id, puntuacion, total_preguntas, fecha, periodo_id")
    .eq("usuario_id", user.id)
    .order("fecha", { ascending: false });

  const { data: periodos } = await supabase.from("periodos").select("id, nombre");
  const periodoPorId = new Map((periodos || []).map((p) => [p.id, p.nombre]));

  return (
    <div>
      <AccountMenu />
      <h1 className="text-xl font-bold mb-1 text-center">Mis resultados</h1>
      <p className="text-muted text-sm text-center mb-6">{user.email}</p>

      {(!intentos || intentos.length === 0) && (
        <div className="card text-center text-muted">
          Todavía no has hecho ningún test oficial.
        </div>
      )}

      <div className="space-y-3">
        {(intentos || []).map((i) => {
          const pct = Math.round((i.puntuacion / i.total_preguntas) * 100);
          return (
            <div key={i.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{periodoPorId.get(i.periodo_id) || "Periodo"}</p>
                <p className="text-xs text-muted">
                  {new Date(i.fecha).toLocaleString("es-ES")}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold ${
                    pct >= 50 ? "text-good" : "text-bad"
                  }`}
                >
                  {pct}%
                </p>
                <p className="text-xs text-muted">
                  {i.puntuacion}/{i.total_preguntas}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <a href="/test" className="block text-center text-sm text-muted mt-6 hover:text-white">
        ← Volver al test
      </a>
    </div>
  );
}
