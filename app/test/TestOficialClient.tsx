"use client";

import { useEffect, useState } from "react";
import type { Pregunta, RespuestaUsuario } from "@/components/QuizRunner";
import ExamOficial from "./ExamOficial";

export default function TestOficialClient({
  periodoId,
  periodoNombre
}: {
  periodoId: string;
  periodoNombre: string;
}) {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{
    score: number;
    total: number;
    respuestas: RespuestaUsuario[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/test/preguntas")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las preguntas del test.");
        return res.json();
      })
      .then((data) => setPreguntas(data.preguntas))
      .catch((e) => setError(e.message));
  }, []);

  async function onFinish(resumen: { score: number; total: number; respuestas: RespuestaUsuario[] }) {
    setEnviando(true);
    try {
      const res = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId,
          puntuacion: resumen.score,
          totalPreguntas: resumen.total,
          respuestas: resumen.respuestas
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo enviar el test.");
      }
      setResultado(resumen);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (error) {
    return <div className="card text-center text-bad">{error}</div>;
  }

  if (enviando) {
    return <div className="card text-center text-muted">Guardando tu resultado...</div>;
  }

  if (resultado && preguntas) {
    const pct = Math.round((resultado.score / resultado.total) * 100);
    return (
      <div>
        <h1 className="text-xl font-bold text-center mb-1">Test oficial</h1>
        <p className="text-muted text-sm text-center mb-6">Periodo: {periodoNombre}</p>

        <div className="card text-center mb-4">
          <div className="text-5xl font-extrabold bg-gradient-to-br from-accent to-accent2 bg-clip-text text-transparent mb-2">
            {pct}%
          </div>
          <p className="text-muted">
            {resultado.score} de {resultado.total} correctas · resultado guardado
          </p>
        </div>

        <div className="space-y-3">
          {preguntas.map((p, i) => {
            const ua = resultado.respuestas[i];
            const enBlanco = ua.seleccionada === 0;
            const opciones = [p.opcion1, p.opcion2, p.opcion3];
            return (
              <div
                key={p.id}
                className={`card !p-4 border-l-4 ${
                  ua.correcta ? "border-l-good" : "border-l-bad"
                }`}
              >
                <p className="text-sm mb-2">
                  {i + 1}. {p.enunciado}
                </p>
                <p className="text-xs text-muted">
                  Tu respuesta:{" "}
                  {enBlanco ? (
                    <span className="text-bad">en blanco</span>
                  ) : (
                    <span className={ua.correcta ? "text-good" : "text-bad"}>
                      {opciones[ua.seleccionada - 1]}
                    </span>
                  )}
                </p>
                {!ua.correcta && (
                  <p className="text-xs text-good mt-1">
                    Correcta: {opciones[p.correcta - 1]}
                  </p>
                )}
                {p.explicacion && (
                  <p className="text-xs text-muted mt-2 italic">{p.explicacion}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!preguntas) {
    return <div className="card text-center text-muted">Cargando preguntas del test...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-center mb-1">Test oficial</h1>
      <p className="text-muted text-sm text-center mb-6">Periodo: {periodoNombre}</p>
      <ExamOficial preguntas={preguntas} onFinish={onFinish} />
    </div>
  );
}
