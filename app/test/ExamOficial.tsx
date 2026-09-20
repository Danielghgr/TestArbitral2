"use client";

import { useState } from "react";
import type { Pregunta, RespuestaUsuario } from "@/components/QuizRunner";

type Props = {
  preguntas: Pregunta[];
  onFinish: (resumen: { score: number; total: number; respuestas: RespuestaUsuario[] }) => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamOficial({ preguntas, onFinish }: Props) {
  const [quiz] = useState(() =>
    preguntas.map((p) => {
      const opciones = [
        { texto: p.opcion1, original: 1 },
        { texto: p.opcion2, original: 2 },
        { texto: p.opcion3, original: 3 }
      ];
      return { ...p, opciones: shuffle(opciones) };
    })
  );

  // respuestas[i] = número de opción original (1,2,3) elegido, o null si está en blanco.
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [index, setIndex] = useState(0);
  const [confirmando, setConfirmando] = useState(false);

  const actual = quiz[index];
  const contestadas = respuestas.filter((r) => r !== null).length;
  const enBlanco = quiz.length - contestadas;

  function elegir(original: number) {
    setRespuestas((prev) => {
      const copia = [...prev];
      // Si ya estaba seleccionada esa misma opción, permite dejarla en blanco pulsándola otra vez.
      copia[index] = copia[index] === original ? null : original;
      return copia;
    });
  }

  function irA(i: number) {
    setIndex(i);
  }

  function terminar() {
    if (enBlanco > 0 && !confirmando) {
      setConfirmando(true);
      return;
    }

    let score = 0;
    const resumenRespuestas: RespuestaUsuario[] = quiz.map((p, i) => {
      const seleccionada = respuestas[i];
      const correcta = seleccionada !== null && seleccionada === p.correcta;
      if (correcta) score++;
      return {
        preguntaId: p.id,
        seleccionada: seleccionada ?? 0,
        correcta
      };
    });

    onFinish({ score, total: quiz.length, respuestas: resumenRespuestas });
  }

  return (
    <div>
      {/* Navegador de preguntas */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3 text-sm text-muted">
          <span>
            Pregunta {index + 1} / {quiz.length}
          </span>
          <span>
            {contestadas} contestadas · {enBlanco} en blanco
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quiz.map((_, i) => {
            const contestada = respuestas[i] !== null;
            const esActual = i === index;
            let cls =
              "w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center border ";
            if (esActual) cls += "border-accent bg-accent text-black";
            else if (contestada) cls += "border-accent/60 bg-accent/15 text-accent";
            else cls += "border-border bg-panel2 text-muted";
            return (
              <button key={i} className={cls} onClick={() => irA(i)}>
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pregunta actual */}
      <div className="card">
        <p className="mb-5 leading-relaxed">{actual.enunciado}</p>

        {actual.opciones.map((op, idx) => {
          const seleccionada = respuestas[index] === op.original;
          const cls = "answer" + (seleccionada ? " selected" : "");
          return (
            <button key={idx} className={cls} onClick={() => elegir(op.original)}>
              {seleccionada && <span className="mr-2">✔</span>}
              {op.texto}
            </button>
          );
        })}

        <p className="text-xs text-muted mt-2">
          Puedes dejarla en blanco pulsando otra vez la opción elegida, o cambiar de respuesta cuando
          quieras antes de terminar el intento.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            className="btn-secondary"
            disabled={index === 0}
            onClick={() => irA(index - 1)}
          >
            ← Anterior
          </button>
          <button
            className="btn-secondary"
            disabled={index === quiz.length - 1}
            onClick={() => irA(index + 1)}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Terminar intento */}
      <div className="card mt-4">
        {confirmando && (
          <p className="text-bad text-sm mb-3">
            Tienes {enBlanco} pregunta{enBlanco !== 1 ? "s" : ""} en blanco. Si terminas ahora, se
            contarán como incorrectas. Pulsa de nuevo para confirmar.
          </p>
        )}
        <button className="btn-primary" onClick={terminar}>
          {confirmando ? "Confirmar y terminar intento" : "Terminar intento"}
        </button>
        {confirmando && (
          <button className="btn-secondary mt-2" onClick={() => setConfirmando(false)}>
            Seguir revisando
          </button>
        )}
      </div>
    </div>
  );
}
