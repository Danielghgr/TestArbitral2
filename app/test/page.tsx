import { createClient } from "@/lib/supabase/server";
import AccountMenu from "@/components/AccountMenu";
import TestOficialClient from "./TestOficialClient";

export default async function TestPage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    // El middleware ya debería haber redirigido, esto es un cinturón de seguridad extra.
    return <p className="text-center text-muted mt-16">Debes iniciar sesión.</p>;
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const { data: periodo } = await supabase
    .from("periodos")
    .select("id, nombre, fecha_inicio, fecha_fin")
    .eq("activo", true)
    .lte("fecha_inicio", hoy)
    .gte("fecha_fin", hoy)
    .maybeSingle();

  if (!periodo) {
    return (
      <div>
        <AccountMenu />
        <div className="card max-w-sm mx-auto mt-8 text-center">
          <h1 className="text-lg font-bold mb-2">No hay ningún periodo de test abierto</h1>
          <p className="text-muted text-sm">
            Vuelve a intentarlo cuando el administrador abra un nuevo periodo. Mientras tanto, puedes
            practicar libremente.
          </p>
          <a href="/practica" className="block btn-secondary mt-5">
            Ir al modo práctica
          </a>
        </div>
      </div>
    );
  }

  const { data: intentoPrevio } = await supabase
    .from("intentos")
    .select("id, puntuacion, total_preguntas, fecha")
    .eq("usuario_id", user.id)
    .eq("periodo_id", periodo.id)
    .maybeSingle();

  if (intentoPrevio) {
    const pct = Math.round((intentoPrevio.puntuacion / intentoPrevio.total_preguntas) * 100);
    return (
      <div>
        <AccountMenu />
        <div className="card max-w-sm mx-auto mt-8 text-center">
          <h1 className="text-lg font-bold mb-2">Ya has completado el test de este periodo</h1>
          <p className="text-muted text-sm mb-4">
            Periodo: {periodo.nombre} ({periodo.fecha_inicio} — {periodo.fecha_fin})
          </p>
          <div className="text-4xl font-extrabold text-accent mb-1">{pct}%</div>
          <p className="text-muted text-sm">
            {intentoPrevio.puntuacion} de {intentoPrevio.total_preguntas} correctas · enviado el{" "}
            {new Date(intentoPrevio.fecha).toLocaleString("es-ES")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountMenu />
      <TestOficialClient periodoId={periodo.id} periodoNombre={periodo.nombre} />
    </div>
  );
}
