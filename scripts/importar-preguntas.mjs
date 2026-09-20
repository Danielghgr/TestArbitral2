// Sube las preguntas de un Excel (mismas columnas que veníamos usando) a la
// tabla `preguntas` de Supabase. Se ejecuta UNA VEZ (o cada vez que quieras
// reemplazar el banco de preguntas) desde tu ordenador, no desde Vercel.
//
// Uso:
//   1) npm install xlsx @supabase/supabase-js
//   2) SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/importar-preguntas.mjs ruta/al/excel.xlsx
//
// Columnas esperadas en el Excel: Question | Answer 1 | Answer 2 | Answer 3 | Correct Answers | Answer Explanation

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const [, , filePath] = process.argv;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!filePath || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/importar-preguntas.mjs archivo.xlsx"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const wb = XLSX.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const preguntas = rows
  .filter((r) => String(r["Question"] || "").trim().length > 0)
  .map((r) => ({
    enunciado: String(r["Question"]).trim(),
    opcion1: String(r["Answer 1"] || "").trim(),
    opcion2: String(r["Answer 2"] || "").trim(),
    opcion3: String(r["Answer 3"] || "").trim(),
    correcta: parseInt(r["Correct Answers"], 10),
    explicacion: String(r["Answer Explanation"] || "").trim() || null
  }))
  .filter((p) => p.opcion1 && p.opcion2 && p.opcion3 && [1, 2, 3].includes(p.correcta));

console.log(`Preguntas válidas detectadas: ${preguntas.length} de ${rows.length} filas`);

// Borra el banco anterior y sube el nuevo (reemplazo completo).
// Si prefieres AÑADIR en vez de reemplazar, comenta la siguiente línea.
const { error: delError } = await supabase.from("preguntas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
if (delError) {
  console.error("Error borrando preguntas anteriores:", delError.message);
  process.exit(1);
}

const { error } = await supabase.from("preguntas").insert(preguntas);
if (error) {
  console.error("Error insertando preguntas:", error.message);
  process.exit(1);
}

console.log("Importación completada correctamente.");
