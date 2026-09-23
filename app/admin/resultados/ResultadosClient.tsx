"use client";

import { useMemo, useState } from "react";

const CATEGORIAS = [
  "1ª Nacional",
  "1ª Autonómica",
  "Autonómico Grupo A",
  "Grupo de Tecnificación",
  "Autonómico Grupo B",
  "Autonómico Grupo C",
  "Autonómico Primer Año",
  "Escuela"
];

type Fila = {
  id: string;
  nick: string;
  categoria: string;
  periodo: string;
  puntuacion: number;
  total: number;
  fecha: string;
};

export default function ResultadosClient({
  filasIniciales,
  periodos
}: {
  filasIniciales: Fila[];
  periodos: string[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [notaMin, setNotaMin] = useState("");
  const [notaMax, setNotaMax] = useState("");
  const [exportando, setExportando] = useState(false);

  const filtradas = useMemo(() => {
    return filasIniciales.filter((f) => {
      const pct = Math.round((f.puntuacion / f.total) * 100);
      const fechaISO = f.fecha.slice(0, 10);

      if (busqueda) {
        if (!f.nick.toLowerCase().includes(busqueda.toLowerCase())) return false;
      }
      if (periodo && f.periodo !== periodo) return false;
      if (categoria && f.categoria !== categoria) return false;
      if (fechaDesde && fechaISO < fechaDesde) return false;
      if (fechaHasta && fechaISO > fechaHasta) return false;
      if (notaMin && pct < parseInt(notaMin, 10)) return false;
      if (notaMax && pct > parseInt(notaMax, 10)) return false;
      return true;
    });
  }, [filasIniciales, busqueda, periodo, categoria, fechaDesde, fechaHasta, notaMin, notaMax]);

  function limpiarFiltros() {
    setBusqueda("");
    setPeriodo("");
    setCategoria("");
    setFechaDesde("");
    setFechaHasta("");
    setNotaMin("");
    setNotaMax("");
  }

  async function exportarExcel() {
    setExportando(true);
    try {
      const XLSX = await import("xlsx");
      const filas = filtradas.map((f) => ({
        NICK: f.nick,
        Categoría: f.categoria || "",
        Periodo: f.periodo,
        Puntuación: f.puntuacion,
        "Total preguntas": f.total,
        "Porcentaje (%)": Math.round((f.puntuacion / f.total) * 100),
        Fecha: new Date(f.fecha).toLocaleString("es-ES")
      }));
      const ws = XLSX.utils.json_to_sheet(filas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resultados");
      const fechaArchivo = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `resultados_test_arbitros_${fechaArchivo}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-bold mb-4">Filtros</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Buscar por NICK"
            className="input sm:col-span-2 lg:col-span-4"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select className="input" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="">Todos los periodos</option>
            {periodos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Nota mín. %"
              className="input"
              value={notaMin}
              onChange={(e) => setNotaMin(e.target.value)}
              min={0}
              max={100}
            />
            <input
              type="number"
              placeholder="Nota máx. %"
              className="input"
              value={notaMax}
              onChange={(e) => setNotaMax(e.target.value)}
              min={0}
              max={100}
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Desde</label>
            <input
              type="date"
              className="input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Hasta</label>
            <input
              type="date"
              className="input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn-secondary !w-auto px-4" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
          <button className="btn-primary !w-auto px-4" onClick={exportarExcel} disabled={exportando}>
            {exportando ? "Generando..." : `Exportar a Excel (${filtradas.length})`}
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold mb-4">
          Resultados ({filtradas.length} de {filasIniciales.length})
        </h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>NICK</th>
              <th>Categoría</th>
              <th>Periodo</th>
              <th>Nota</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f) => {
              const pct = Math.round((f.puntuacion / f.total) * 100);
              return (
                <tr key={f.id}>
                  <td>{f.nick}</td>
                  <td>{f.categoria || "—"}</td>
                  <td>{f.periodo}</td>
                  <td>
                    {f.puntuacion}/{f.total} ({pct}%)
                  </td>
                  <td>{new Date(f.fecha).toLocaleString("es-ES")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
