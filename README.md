# Test de Árbitros — FBM (app completa con login)

App Next.js + Supabase con tres partes:

- **`/practica`** — pública, sin login, tests aleatorios ilimitados. Solo registra un contador anónimo de usos (sin nota, sin usuario).
- **`/test`** — test oficial, requiere login, un único intento por usuario y periodo abierto.
- **`/admin`** — panel para el administrador: alta/baja de usuarios, abrir/cerrar periodos, ver resultados y ver el contador de práctica.

---

## 1. Crear el proyecto en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta / un proyecto nuevo.
2. Ve a **SQL Editor** y pega el contenido de `supabase/schema.sql` (está en este mismo proyecto). Dale a **Run**. Esto crea todas las tablas, los permisos (RLS) y el trigger que da de alta el perfil automáticamente al crear un usuario.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (¡secreta!) → será `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Configurar el proyecto en local (opcional, para probar antes de publicar)

```bash
npm install
cp .env.example .env.local
# rellena .env.local con las 3 claves del paso anterior
npm run dev
```

Abre `http://localhost:3000`.

---

## 3. Importar tus preguntas

Usa el script incluido para subir tu Excel (mismas columnas de siempre:
`Question`, `Answer 1`, `Answer 2`, `Answer 3`, `Correct Answers`,
`Answer Explanation`) directamente a la tabla `preguntas` de Supabase:

```bash
npm install xlsx @supabase/supabase-js
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/importar-preguntas.mjs ruta/a/tu/excel.xlsx
```

Cada vez que quieras reemplazar el banco de preguntas, vuelve a ejecutar el
script con el Excel nuevo (mismas columnas) — borra las preguntas anteriores
y sube las nuevas.

---

## 4. Crear el primer usuario administrador

Antes de tener el panel de admin funcionando, necesitas al menos un admin:

1. En Supabase, ve a **Authentication → Users → Add user** y crea un usuario
   (email + contraseña) manualmente. Esto disparará el trigger y creará su
   fila en `profiles` con rol `usuario`.
2. Ve a **SQL Editor** y ejecuta (cambia el email):
   ```sql
   update profiles set rol = 'admin' where email = 'admin@tuclub.com';
   ```
3. Ya puedes entrar en `/login` con ese usuario y acceder a `/admin`. Desde
   ahí podrás dar de alta al resto de árbitros sin volver a tocar SQL.

---

## 5. Subir el proyecto a GitHub y desplegarlo en Vercel

1. Sube esta carpeta completa a un repositorio nuevo en GitHub (igual que
   hiciste con el test estático: "Add file → Upload files", o con `git push`
   si lo prefieres).
2. En [vercel.com](https://vercel.com), **Add New → Project** y selecciona
   ese repositorio. Vercel detecta que es Next.js automáticamente.
3. Antes de pulsar Deploy, ve a **Environment Variables** y añade las
   mismas 3 claves del paso 1 (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Dale a **Deploy**. En un par de minutos tendrás tu URL pública, con las
   tres secciones (`/practica`, `/login`, `/admin`) funcionando.

Cada vez que subas un cambio al repositorio, Vercel vuelve a desplegar solo.

---

## 6. Uso del día a día

- **Admin** entra en `/admin/periodos` y crea un periodo (ej. "Marzo 2027",
  del 1 al 10). Mientras esté dentro de esas fechas y activo, el test
  oficial estará disponible para los usuarios.
- **Admin** entra en `/admin/usuarios` y da de alta a cada árbitro con su
  email y una contraseña inicial (puede cambiarla luego desde Supabase si
  hace falta un "olvidé mi contraseña", o se puede añadir esa función más
  adelante).
- **Árbitros** entran en `/login`, hacen el test una vez dentro del periodo,
  y no pueden repetirlo (está bloqueado tanto en la interfaz como a nivel
  de base de datos).
- Cualquiera puede entrar en `/practica` en cualquier momento, sin login.

---

## Notas técnicas

- El número de preguntas del test oficial está fijado en el código
  (`NUM_PREGUNTAS_TEST` en `app/api/test/preguntas/route.ts`, por defecto
  20). Cámbialo si quieres otro número.
- El límite de preguntas en modo práctica es 25 (igual que en la versión
  estática anterior).
- "Un solo intento por usuario y periodo" está garantizado a nivel de base
  de datos (`unique(usuario_id, periodo_id)` en la tabla `intentos`), así
  que aunque alguien manipule la app desde el navegador, la base de datos
  rechazará un segundo envío.
- La `service_role key` de Supabase (la que se salta la seguridad) **solo**
  se usa en `app/api/admin/usuarios/route.ts`, en el servidor, y solo tras
  comprobar que quien llama ya está autenticado como admin. Nunca llega al
  navegador.
