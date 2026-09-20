import { createClient } from "@/lib/supabase/server";
import PeriodosClient from "./PeriodosClient";

export default async function PeriodosPage() {
  const supabase = createClient();
  const { data: periodos } = await supabase
    .from("periodos")
    .select("id, nombre, fecha_inicio, fecha_fin, activo")
    .order("fecha_inicio", { ascending: false });

  return <PeriodosClient periodosIniciales={periodos || []} />;
}
