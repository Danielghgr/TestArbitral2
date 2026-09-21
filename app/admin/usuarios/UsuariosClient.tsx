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
  { value: "usuario", label: "Árbitro" },
  { value: "responsable", label: "Responsable" },
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

  // --- Importación masiva desde Excel ---
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<
    { fila: number; email: string; ok: boolean; mensaje: string }[] | null
  >(null);

  function normalizarCabecera(s: string) {
    return s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quita acentos: "categoría" -> "categoria"
  }

  function resolverRol(valor: string): string {
    const v = normalizarCabecera(valor || "");
    if (["admin"].includes(v)) return "admin";
    if (["responsable"].includes(v)) return "responsable";
    return "usuario"; // "arbitro", "usuario", vacío, o cualquier otra cosa -> por defecto
  }

  function resolverCategoria(valor: string): string | null {
    if (!valor) return null;
    const v = normalizarCabecera(valor);
    const match = CATEGORIAS.find((c) => normalizarCabecera(c) === v);
    return match || null;
  }

  async function descargarPlantilla() {
    const XLSX = await import("xlsx");
    const ejemplo = [
      {
        Email: "nombre.apellido@ejemplo.com",
        Contraseña: "cambiar123",
        Nombre: "Nombre Apellido",
        Categoría: "Escuela",
        Rol: "Árbitro"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(ejemplo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "plantilla_usuarios.xlsx");
  }

  async function importarExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // permite volver a elegir el mismo archivo si hace falta reintentar

    setImportando(true);
    setResultadoImport(null);

    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const filas: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const resultados: { fila: number; email: string; ok: boolean; mensaje: string }[] = [];
    const nuevosUsuarios: Usuario[] = [];

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      // Busca cada columna sin importar mayúsculas/acentos/orden.
      const claves = Object.keys(fila).reduce<Record<string, string>>((acc, k) => {
        acc[normalizarCabecera(k)] = String(fila[k] ?? "").trim();
        return acc;
      }, {});

      const email = claves["email"] || claves["correo"] || "";
      const password = claves["contrasena"] || claves["password"] || claves["clave"] || "";
      const nombre = claves["nombre"] || "";
      const categoria = resolverCategoria(claves["categoria"] || "");
      const rol = resolverRol(claves["rol"] || "");

      if (!email || !password) {
        resultados.push({
          fila: i + 2, // +2: la fila 1 es la cabecera, y los índices empiezan en 0
          email: email || "(sin email)",
          ok: false,
          mensaje: "Falta email o contraseña"
        });
        continue;
      }
      if (password.length < 6) {
        resultados.push({ fila: i + 2, email, ok: false, mensaje: "Contraseña muy corta (mínimo 6)" });
        continue;
      }

      try {
        const res = await fetch("/api/admin/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, nombre, categoria, rol })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error desconocido");

        resultados.push({ fila: i + 2, email, ok: true, mensaje: "Creado correctamente" });
        nuevosUsuarios.push({
          id: data.id,
          email,
          nombre,
          categoria,
          rol,
          activo: true,
          created_at: new Date().toISOString()
        });
      } catch (err: any) {
        resultados.push({ fila: i + 2, email, ok: false, mensaje: err.message || "Error al crearlo" });
      }
    }

    setUsuarios((prev) => [...nuevosUsuarios, ...prev]);
    setResultadoImport(resultados);
    setImportando(false);
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

      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold">Importar varios usuarios desde Excel</h2>
          <button className="btn-secondary !w-auto px-3 py-1 text-xs" onClick={descargarPlantilla}>
            Descargar plantilla
          </button>
        </div>
        <p className="text-muted text-sm mb-4">
          Columnas: <strong>Email</strong> y <strong>Contraseña</strong> (obligatorias), y opcionalmente{" "}
          <strong>Nombre</strong>, <strong>Categoría</strong> (debe coincidir con una de la lista) y{" "}
          <strong>Rol</strong> (Árbitro / Responsable / Admin — si se deja vacío, se crea como Árbitro).
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={importarExcel}
          disabled={importando}
          className="input"
        />
        {importando && <p className="text-muted text-sm mt-3">Importando, no cierres esta pantalla...</p>}

        {resultadoImport && (
          <div className="mt-4 overflow-x-auto">
            <p className="text-sm mb-2">
              {resultadoImport.filter((r) => r.ok).length} creados correctamente de{" "}
              {resultadoImport.length} filas.
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Email</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {resultadoImport.map((r, i) => (
                  <tr key={i}>
                    <td>{r.fila}</td>
                    <td>{r.email}</td>
                    <td className={r.ok ? "text-good" : "text-bad"}>{r.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
