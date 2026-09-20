"use client";

import { useState } from "react";
import QuizRunner, { type Pregunta } from "@/components/QuizRunner";

export default function PracticaPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [cantidad, setCantidad] = useState(20);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function empezar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/preguntas/publicas?n=${cantidad}`);
      if (!res.ok) throw new Error("No se pudieron cargar las preguntas.");
      const data = await res.json();
      setPreguntas(data.preguntas);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  function onFinish() {
    // Registro anónimo: solo suma +1, sin guardar nota ni usuario.
    fetch("/api/practica/registrar", { method: "POST" }).catch(() => {});
  }

  if (preguntas) {
    return (
      <div>
        <h1 className="text-xl font-bold text-center mb-1">Modo práctica</h1>
        <p className="text-muted text-sm text-center mb-6">Sin login · resultados no guardados</p>
        <QuizRunner
          preguntas={preguntas}
          onFinish={onFinish}
          tituloFinal="Puedes repetir el test de práctica cuantas veces quieras."
        />
        <button className="btn-secondary mt-4" onClick={() => setPreguntas(null)}>
          Nuevo test de práctica
        </button>
      </div>
    );
  }

  return (
    <div className="card max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-bold mb-1 text-center">Modo práctica</h1>
      <p className="text-muted text-sm text-center mb-6">
        Test aleatorio libre, sin necesidad de usuario. No se guarda ninguna nota.
      </p>

      <label className="block text-sm text-muted mb-2">Número de preguntas</label>
      <div className="flex gap-2 mb-6">
        {[10, 20, 25].map((n) => (
          <button
            key={n}
            className={`chip flex-1 py-2 rounded-full border text-sm ${
              cantidad === n ? "bg-accent text-black font-semibold border-accent" : "border-border bg-panel2"
            }`}
            onClick={() => setCantidad(n)}
          >
            {n}
          </button>
        ))}
      </div>

      {error && <p className="text-bad text-sm mb-3">{error}</p>}

      <button className="btn-primary" onClick={empezar} disabled={cargando}>
        {cargando ? "Cargando..." : "Empezar a practicar"}
      </button>

      <a href="/login" className="block text-center text-sm text-muted mt-6 hover:text-white">
        ¿Vas a hacer el test oficial? Inicia sesión →
      </a>
    </div>
  );
}
