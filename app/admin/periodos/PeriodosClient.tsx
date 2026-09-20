"use client";

import { useState } from "react";

type Periodo = {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
};

export default function PeriodosClient({ periodosIniciales }: { periodosIniciales: Periodo[] }) {
  const [periodos, setPeriodos] = useState(periodosIniciales);
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);

  async function crearPeriodo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreando(true);
    try {
      const res = await fetch("/api/admin/periodos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, fechaInicio, fechaFin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el periodo");

      setPeriodos((prev) => [data.periodo, ...prev]);
      setNombre("");
      setFechaInicio("");
      setFechaFin("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreando(false);
    }
  }

  async function toggleActivo(p: Periodo) {
    const nuevoEstado = !p.activo;
    setPeriodos((prev) => prev.map((x) => (x.id === p.id ? { ...x, activo: nuevoEstado } : x)));
    await fetch("/api/admin/periodos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, activo: nuevoEstado })
    });
  }

  function estaAbierto(p: Periodo) {
    return p.activo && p.fecha_inicio <= hoy && p.fecha_fin >= hoy;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-bold mb-4">Nuevo periodo</h2>
        <form onSubmit={crearPeriodo} className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            required
            placeholder="Nombre (ej. Marzo 2027)"
            className="input sm:col-span-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="date"
            required
            className="input"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <input
            type="date"
            required
            className="input"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <button type="submit" className="btn-primary sm:col-span-4" disabled={creando}>
            {creando ? "Creando..." : "Crear periodo"}
          </button>
        </form>
        {error && <p className="text-bad text-sm mt-2">{error}</p>}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold mb-4">Periodos</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {periodos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.fecha_inicio}</td>
                <td>{p.fecha_fin}</td>
                <td>
                  <span className={estaAbierto(p) ? "text-good" : "text-muted"}>
                    {estaAbierto(p) ? "Abierto ahora" : p.activo ? "Programado / cerrado" : "Desactivado"}
                  </span>
                </td>
                <td>
                  <button className="btn-secondary !w-auto px-3 py-1 text-xs" onClick={() => toggleActivo(p)}>
                    {p.activo ? "Desactivar" : "Reactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
