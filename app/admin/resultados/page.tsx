import { createClient } from "@/lib/supabase/server";
import ResultadosClient from "./ResultadosClient";

export default async function ResultadosPage() {
  const supabase = createClient();

  const { data: intentos } = await supabase
    .from("intentos")
    .select("id, puntuacion, total_preguntas, fecha, usuario_id, periodo_id")
    .order("fecha", { ascending: false });

  const { data: perfiles } = await supabase.from("profiles").select("id, nick, categoria");

  const { data: periodos } = await supabase.from("periodos").select("id, nombre");

  const perfilPorId = new Map((perfiles || []).map((p) => [p.id, p]));
  const periodoPorId = new Map((periodos || []).map((p) => [p.id, p.nombre]));

  const filas = (intentos || []).map((i) => {
    const perfil = perfilPorId.get(i.usuario_id);
    return {
      id: i.id,
      nick: perfil?.nick || "",
      categoria: perfil?.categoria || "",
      periodo: periodoPorId.get(i.periodo_id) || "",
      puntuacion: i.puntuacion,
      total: i.total_preguntas,
      fecha: i.fecha
    };
  });

  const periodosNombres = Array.from(new Set(filas.map((f) => f.periodo))).filter(Boolean);

  return <ResultadosClient filasIniciales={filas} periodos={periodosNombres} />;
}
