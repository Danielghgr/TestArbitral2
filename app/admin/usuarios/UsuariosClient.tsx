"use client";

import { useState } from "react";

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

const ROLES = [
  { value: "usuario", label: "Usuario (árbitro)" },
  { value: "responsable", label: "Responsable (solo resultados)" },
  { value: "admin", label: "Admin" }
];

type Usuario = {
  id: string;
  email: string | null;
  nombre: string | null;
  categoria: string | null;
  rol: string;
  activo: boolean;
  created_at: string;
};

export default function UsuariosClient({ usuariosIniciales }: { usuariosIniciales: Usuario[] }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [categoria, setCategoria] = useState("");
  const [rol, setRol] = useState("usuario");
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreando(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nombre, categoria: categoria || null, rol })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el usuario");

      setUsuarios((prev) => [
        {
          id: data.id,
          email,
          nombre,
          categoria: categoria || null,
          rol,
          activo: true,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setEmail("");
      setNombre("");
      setPassword("");
      setCategoria("");
      setRol("usuario");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreando(false);
    }
  }

  async function toggleActivo(u: Usuario) {
    const nuevoEstado = !u.activo;
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: nuevoEstado } : x)));
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, activo: nuevoEstado })
    });
  }

  async function cambiarCategoria(u: Usuario, nuevaCategoria: string) {
    const valor = nuevaCategoria || null;
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, categoria: valor } : x)));
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, categoria: valor })
    });
  }

  async function cambiarRol(u: Usuario, nuevoRol: string) {
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol: nuevoRol } : x)));
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, rol: nuevoRol })
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-bold mb-4">Dar de alta un usuario</h2>
        <form onSubmit={crearUsuario} className="grid gap-3 sm:grid-cols-2">
          <input
            type="email"
            required
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="text"
            required
            placeholder="Contraseña inicial"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input" value={rol} onChange={(e) => setRol(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary sm:col-span-2" disabled={creando}>
            {creando ? "Creando..." : "Crear usuario"}
          </button>
        </form>
        {error && <p className="text-bad text-sm mt-2">{error}</p>}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-bold mb-4">Usuarios ({usuarios.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.nombre}</td>
                <td>
                  <select
                    className="input !py-1 !px-2 text-xs !w-auto min-w-[180px]"
                    value={u.categoria || ""}
                    onChange={(e) => cambiarCategoria(u, e.target.value)}
                  >
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="input !py-1 !px-2 text-xs !w-auto min-w-[200px]"
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={u.activo ? "text-good" : "text-bad"}>
                    {u.activo ? "Activo" : "Dado de baja"}
                  </span>
                </td>
                <td>
                  <button className="btn-secondary !w-auto px-3 py-1 text-xs" onClick={() => toggleActivo(u)}>
                    {u.activo ? "Dar de baja" : "Reactivar"}
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
