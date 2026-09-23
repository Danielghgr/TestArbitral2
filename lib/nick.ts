// Supabase Auth necesita internamente algo con forma de email para
// identificar cada cuenta — es una limitación de la plataforma. Como en esta
// app el usuario solo ve y usa un NICK, generamos ese "email técnico" a
// partir del NICK de forma determinista, sin que nadie lo vea ni se use
// nunca para enviar nada real. Login y creación de usuarios usan esta misma
// función para que el resultado coincida siempre.
export function nickToEmail(nick: string): string {
  const normalizado = nick
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos: "Pérez" -> "Perez"
    .replace(/[^a-z0-9]+/g, ".") // cualquier cosa que no sea letra/número -> "."
    .replace(/^\.+|\.+$/g, ""); // quita puntos sueltos al principio/final

  return `${normalizado}@arbitros-fbm.local`;
}

export function nickValido(nick: string): boolean {
  return nickToEmail(nick).length > "@arbitros-fbm.local".length + 1;
}
