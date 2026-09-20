"use client";

import { useState } from "react";

export type Pregunta = {
  id: string;
  enunciado: string;
  opcion1: string;
  opcion2: string;
  opcion3: string;
  correcta: number; // 1, 2 o 3
  explicacion: string | null;
};

type Props = {
  preguntas: Pregunta[];
  // Se llama al terminar el test con el resumen (score, respuestas).
  // Útil para el test oficial (enviar a /api/test/submit) o práctica (registrar uso).
  onFinish?: (resumen: { score: number; total: number; respuestas: RespuestaUsuario[] }) => void;
  tituloFinal?: string;
};

export type RespuestaUsuario = {
  preguntaId: string;
  seleccionada: number; // índice 1-3 mostrado al usuario (tras barajar)
  correcta: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizRunner({ preguntas, onFinish, tituloFinal }: Props) {
  // Barajamos también el orden de las opciones de cada pregunta, una sola vez.
  const [quiz] = useState(() =>
    preguntas.map((p) => {
      const opciones = [
        { texto: p.opcion1, original: 1 },
        { texto: p.opcion2, original: 2 },
        { texto: p.opcion3, original: 3 }
      ];
      const barajadas = shuffle(opciones);
      return { ...p, opciones: barajadas };
    })
  );

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaUsuario[]>([]);
  const [terminado, setTerminado] = useState(false);

  const actual = quiz[index];

  function seleccionar(opcionIdx: number) {
    if (selected !== null) return;
    setSelected(opcionIdx);

    const opcionElegida = actual.opciones[opcionIdx];
    const esCorrecta = opcionElegida.original === actual.correcta;
    if (esCorrecta) setScore((s) => s + 1);

    setRespuestas((prev) => [
      ...prev,
      { preguntaId: actual.id, seleccionada: opcionElegida.original, correcta: esCorrecta }
    ]);
  }

  function siguiente() {
    if (index + 1 >= quiz.length) {
      setTerminado(true);
      onFinish?.({ score, total: quiz.length, respuestas });
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  if (quiz.length === 0) {
    return <div className="card text-center text-muted">No hay preguntas disponibles.</div>;
  }

  if (terminado) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="card text-center">
        <div className="text-5xl font-extrabold bg-gradient-to-br from-accent to-accent2 bg-clip-text text-transparent mb-2">
          {pct}%
        </div>
        <p className="text-muted mb-4">
          {score} de {quiz.length} correctas
        </p>
        {tituloFinal && <p className="text-sm text-muted">{tituloFinal}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between text-sm text-muted mb-2">
        <span>
          Pregunta {index + 1} / {quiz.length}
        </span>
        <span>Aciertos: {score}</span>
      </div>
      <div className="h-1.5 bg-panel2 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent2 transition-all"
          style={{ width: `${(index / quiz.length) * 100}%` }}
        />
      </div>

      <p className="mb-5 leading-relaxed">{actual.enunciado}</p>

      {actual.opciones.map((op, idx) => {
        let cls = "answer";
        if (selected !== null) {
          if (op.original === actual.correcta) cls += " correct";
          else if (idx === selected) cls += " incorrect";
        }
        return (
          <button key={idx} className={cls} disabled={selected !== null} onClick={() => seleccionar(idx)}>
            {op.texto}
          </button>
        );
      })}

      {selected !== null && (
        <div className="mt-4 p-4 rounded-xl bg-panel2 border-l-4 border-accent text-sm text-muted leading-relaxed">
          <strong className="text-white">Respuesta correcta:</strong>{" "}
          {actual.opciones.find((o) => o.original === actual.correcta)?.texto}
          {actual.explicacion && (
            <>
              <br />
              <br />
              <strong className="text-white">Explicación:</strong> {actual.explicacion}
            </>
          )}
        </div>
      )}

      {selected !== null && (
        <button className="btn-primary mt-5" onClick={siguiente}>
          {index + 1 >= quiz.length ? "Ver resultado" : "Siguiente"}
        </button>
      )}
    </div>
  );
}
