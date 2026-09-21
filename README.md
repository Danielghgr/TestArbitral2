# Test de Árbitros — FBM

App web con login para que los árbitros de la Federación de Baloncesto de Madrid hagan un test oficial mensual, más un modo de práctica libre sin login. Construida con Next.js + Supabase, desplegada en Vercel.

- **`/practica`** — pública, sin login, tests aleatorios ilimitados para entrenar.
- **`/login` → `/test`** — test oficial, un único intento por periodo abierto.
- **`/admin`** — panel de gestión, con distintas vistas según el rol.

---

## 1. Roles y qué puede hacer cada uno

Hay tres roles, además de cualquiera que no tenga cuenta (visitante anónimo):

| | Visitante (sin login) | Árbitro | Responsable | Admin |
|---|---|---|---|---|
| Hacer tests de práctica (`/practica`) | ✅ | ✅ | ✅ | ✅ |
| Hacer el test oficial (`/test`) | ❌ | ✅ (un intento por periodo) | ❌ | ❌ |
| Ver su propio historial (`/mis-resultados`) | ❌ | ✅ | ❌ | ❌ |
| Cambiar su propia contraseña (`/cuenta`) | ❌ | ✅ | ✅ | ✅ |
| Ver los resultados de **todos** los árbitros | ❌ | ❌ | ✅ | ✅ |
| Filtrar y exportar resultados a Excel | ❌ | ❌ | ✅ | ✅ |
| Dar de alta / baja usuarios | ❌ | ❌ | ❌ | ✅ |
| Cambiar la categoría o el rol de un usuario | ❌ | ❌ | ❌ | ✅ |
| Abrir / cerrar periodos de test | ❌ | ❌ | ❌ | ✅ |
| Ver estadísticas de uso del modo práctica | ❌ | ❌ | ❌ | ✅ |

**Detalle de cada rol:**

- **Árbitro** (rol `usuario` en la base de datos): es el rol por defecto de cualquier usuario que se dé de alta. Solo ve el test oficial, su propio historial y su cuenta. Al iniciar sesión entra directo en `/test`.
- **Responsable**: pensado para alguien que solo necesita **consultar** resultados (por ejemplo, un coordinador), sin poder tocar usuarios ni periodos. Al iniciar sesión entra directo en la pantalla de resultados, y si intenta entrar a cualquier otra URL del panel de admin (usuarios, periodos...) escribiéndola a mano, se le redirige de vuelta — está bloqueado también a nivel de base de datos, no es solo que no vea el botón.
- **Admin**: acceso total al panel. Al iniciar sesión entra en `/admin`, con las 5 pestañas: Resumen, Usuarios, Periodos, Resultados y Uso de práctica.

---

## 2. Cómo dar de alta (o gestionar) usuarios

Todo se hace desde el panel, sin tocar Supabase directamente:

1. Entra como **admin** en `/admin/usuarios`.
2. En "Dar de alta un usuario", rellena:
   - **Email** — será su usuario para iniciar sesión.
   - **Nombre** (opcional).
   - **Contraseña inicial** — la eliges tú; no hay email de confirmación, la cuenta queda activa al momento. Anótala en algún sitio seguro para pasársela a la persona, porque tampoco tú podrás volver a consultarla después.
   - **Categoría** — desplegable (1ª Nacional, 1ª Autonómica, Autonómico Grupo A/B/C, Grupo de Tecnificación, Autonómico Primer Año, Escuela, o "Sin categoría").
   - **Rol** — Árbitro / Responsable / Admin.
3. Pulsa "Crear usuario".

**Para editar a alguien que ya existe**, en la tabla de abajo cada fila tiene desplegables de Categoría y Rol que se guardan solos al cambiarlos (sin botón de "guardar"), y un botón "Dar de baja" / "Reactivar" para bloquear o desbloquear el acceso sin borrar su cuenta ni su historial.

**Para dar de alta a varios de golpe**, en esa misma página hay una tarjeta "Importar varios usuarios desde Excel":

1. Pulsa "Descargar plantilla" para bajarte un Excel de ejemplo con las columnas correctas.
2. Rellena una fila por persona. Columnas: `Email` y `Contraseña` (obligatorias), y opcionalmente `Nombre`, `Categoría` (debe escribirse igual que en la lista de categorías) y `Rol` (Árbitro / Responsable / Admin — si se deja vacío, se crea como Árbitro).
3. Sube el archivo con el selector de archivo. Se crean uno a uno automáticamente, y al terminar se muestra una tabla con el resultado fila por fila (creado correctamente, o el motivo del fallo — por ejemplo un email duplicado).

No hace falta terminal ni Node para esto — todo ocurre en el navegador.

**Para que alguien cambie su propia contraseña** más adelante, no hace falta que el admin intervenga: cualquier usuario puede hacerlo él mismo desde "Cambiar contraseña" (arriba a la derecha, una vez logueado) → `/cuenta`.

---

## 3. Cómo cambiar las preguntas del test

Las preguntas viven en la tabla `preguntas` de Supabase, y las usan tanto el test oficial como el modo práctica (es el mismo banco). Hay dos formas de tocarlas:

### Opción A — Reemplazar todo el banco desde un Excel (recomendado para cambios grandes)

Usa el script incluido en `scripts/importar-preguntas.mjs`. El Excel debe tener exactamente estas columnas (mismo nombre, no hace falta el mismo orden):

- `Question`
- `Answer 1`
- `Answer 2`
- `Answer 3`
- `Correct Answers` → un número: `1`, `2` o `3` (cuál de las tres es la correcta)
- `Answer Explanation` → opcional, puede ir vacío en algunas filas

Desde tu ordenador (necesitas Node.js instalado):

```bash
npm install xlsx @supabase/supabase-js
SUPABASE_URL=https://tu-proyecto.supabase.co SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role node scripts/importar-preguntas.mjs ruta/a/tu/excel.xlsx
```

⚠️ Este script **borra todas las preguntas anteriores** y sube las nuevas del Excel (reemplazo completo, no añade). Si prefieres que añada en vez de reemplazar, hay que comentar la línea que hace el `delete` dentro del propio script.

La `SUPABASE_URL` es tu URL de proyecto (sin nada detrás del `.co`), y la `SUPABASE_SERVICE_ROLE_KEY` la sacas de Supabase → Project Settings → API (la fila "service_role", no la "anon"). Es una clave secreta: no la compartas ni la subas a ningún sitio público.

### Opción B — Editar preguntas sueltas directamente en Supabase

Para corregir una pregunta puntual, añadir una nueva, o borrar una:

1. Ve a Supabase → **Table Editor** → tabla `preguntas`.
2. Edita la fila directamente haciendo doble clic en la celda que quieras cambiar, o usa "Insert row" para añadir una pregunta nueva, o el icono de papelera para borrar una.
3. Los cambios se aplican al momento — no hace falta redesplegar nada en Vercel, ya que la app siempre lee las preguntas en tiempo real desde Supabase.

**Columnas de la tabla `preguntas`:** `enunciado` (el texto de la pregunta), `opcion1`/`opcion2`/`opcion3` (las tres respuestas), `correcta` (número 1, 2 o 3), `explicacion` (texto que se muestra al corregir, puede dejarse vacío).

---

## 4. Periodos del test oficial

Solo el admin puede gestionarlos, desde `/admin/periodos`:

- Crea uno nuevo con un nombre (ej. "Marzo 2027"), fecha de inicio y fecha de fin.
- Mientras la fecha de hoy esté dentro de ese rango y el periodo esté activo, el test oficial estará disponible para los árbitros en `/test`.
- Cada árbitro solo puede hacer **un intento** por periodo — está bloqueado tanto en la interfaz como en la propia base de datos, así que no hay forma de saltárselo aunque se manipule la app desde el navegador.
- El número de preguntas del test oficial es fijo (25), configurado en el código (`app/api/test/preguntas/route.ts`), no desde la interfaz.

---

## 5. Resultados

En `/admin/resultados` (visible para admin y responsable):

- Filtros combinables: buscador por email/nombre, periodo, categoría, rango de nota (%), y rango de fechas.
- Botón **"Exportar a Excel"**: descarga un `.xlsx` con exactamente las filas que estés viendo en ese momento (si filtras antes, exporta solo lo filtrado).

Cada árbitro, además, puede ver su propio historial (solo el suyo) en `/mis-resultados`.

---

## 6. Uso de práctica

En `/admin/practica` (solo admin) se ve cuántas veces se ha usado el modo práctica, agrupado por día. No se guarda quién lo hizo ni qué nota sacó — es un contador totalmente anónimo, solo de uso.

---

## 7. Mantenimiento: que Supabase no se pause

El proyecto de Supabase gratuito se pausa automáticamente si pasan 7 días sin ninguna petición a la base de datos. Como el uso de esta app es mensual (por los periodos), hay un workflow de GitHub Actions (`.github/workflows/keep-alive.yml`) que hace una petición de lectura cada 3 días para evitarlo. No requiere que hagas nada una vez configurado — solo asegúrate de que los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY` están añadidos en el repositorio (GitHub → Settings → Secrets and variables → Actions).

---

## 8. Desplegar desde cero (referencia)

Si algún día necesitas montar el proyecto en un Supabase/Vercel nuevos:

1. **Supabase:** crea el proyecto, ejecuta `supabase/schema.sql` en el SQL Editor (crea tablas, seguridad y funciones), y copia las 3 claves de Project Settings → API.
2. **Primer admin:** crea un usuario desde Supabase → Authentication → Users, y en el SQL Editor ejecuta `update profiles set rol = 'admin' where email = 'tu_email';`. A partir de ahí, ya puedes gestionar todo (incluidos más admins/responsables) desde el propio panel.
3. **Preguntas:** importa tu Excel con `scripts/importar-preguntas.mjs` (ver sección 3).
4. **Vercel:** conecta el repo de GitHub, añade las 3 variables de entorno de Supabase en Settings → Environment Variables (marca "Production" en las tres), y despliega. Framework Preset debe detectarse solo como "Next.js".
5. **Keep-alive:** añade los secrets de GitHub Actions (sección 7) para que Supabase no se pause.

Cada `git push` a `main` despliega automáticamente en Vercel.

---

## Notas técnicas

- Stack: Next.js 14 (App Router) + Supabase (Postgres + Auth) + Tailwind, hosting estático/serverless en Vercel.
- La seguridad de quién puede ver/tocar qué está aplicada a nivel de base de datos (Row Level Security de Supabase), no solo ocultando botones en la interfaz — así que aunque alguien manipule el navegador, sigue sin poder acceder a datos que no le correspondan.
- La `service_role key` de Supabase (permisos totales, salta la seguridad) solo se usa en el servidor, en las rutas de `/api/admin/*`, y solo después de comprobar que quien llama ya está autenticado como admin. Nunca llega al navegador.
