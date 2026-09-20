import { createClient } from "@/lib/supabase/server";

export default async function PracticaStatsPage() {
  const supabase = createClient();
  const { data, count } = await supabase
    .from("practica_stats")
    .select("fecha", { count: "exact" });

  const porDia = new Map<string, number>();
  (data || []).forEach((row) => {
    porDia.set(row.fecha, (porDia.get(row.fecha) || 0) + 1);
  });
  const dias = Array.from(porDia.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="text-muted text-sm mb-1">Total de tests de práctica realizados</p>
        <p className="text-3xl font-bold">{count ?? 0}</p>
      </div>
      <div className="card overflow-x-auto">
        <h2 className="font-bold mb-4">Uso por día</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Veces usado</th>
            </tr>
          </thead>
          <tbody>
            {dias.map(([fecha, n]) => (
              <tr key={fecha}>
                <td>{fecha}</td>
                <td>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
