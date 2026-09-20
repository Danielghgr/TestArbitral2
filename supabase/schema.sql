-- ============================================================
-- ESQUEMA COMPLETO — Test de Árbitros FBM
-- Ejecutar en Supabase: Dashboard -> SQL Editor -> pegar y "Run"
-- ============================================================

-- ---------- PERFILES ----------
-- Extiende auth.users con rol y estado activo/inactivo.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  categoria text check (categoria in (
    '1ª Nacional',
    '1ª Autonómica',
    'Autonómico Grupo A',
    'Grupo de Tecnificación',
    'Autonómico Grupo B',
    'Autonómico Grupo C',
    'Autonómico Primer Año',
    'Escuela'
  )),
  rol text not null default 'usuario' check (rol in ('usuario','admin')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Crea automáticamente una fila en profiles cuando el admin da de alta
-- un usuario nuevo en auth.users (vía la API de administración).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre, rol, activo)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', new.email), 'usuario', true);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- PERIODOS ----------
create table if not exists periodos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PREGUNTAS ----------
-- Banco compartido entre el test oficial y el modo práctica.
create table if not exists preguntas (
  id uuid primary key default gen_random_uuid(),
  enunciado text not null,
  opcion1 text not null,
  opcion2 text not null,
  opcion3 text not null,
  correcta smallint not null check (correcta in (1,2,3)),
  explicacion text,
  created_at timestamptz not null default now()
);

-- ---------- INTENTOS (test oficial) ----------
create table if not exists intentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  periodo_id uuid not null references periodos(id) on delete cascade,
  respuestas jsonb not null,
  puntuacion int not null,
  total_preguntas int not null,
  fecha timestamptz not null default now(),
  unique (usuario_id, periodo_id) -- garantiza UN solo intento por usuario y periodo
);

-- ---------- CONTADOR DE PRÁCTICAS (anónimo) ----------
-- Se inserta una fila cada vez que alguien termina un test de práctica.
-- No guarda usuario, IP, ni nota: solo sirve para contar cuántas veces se usa.
create table if not exists practica_stats (
  id bigint generated always as identity primary key,
  fecha date not null default current_date
);

-- ============================================================
-- FUNCIÓN AUXILIAR PARA COMPROBAR EL ROL DE ADMIN
-- ============================================================
-- Se usa "security definer" para que esta consulta NO pase por las
-- políticas RLS de "profiles" al evaluarse. Si no se hiciera así, una
-- política de "profiles" que consulta "profiles" para saber si eres admin
-- dispararía esa misma política de nuevo -> error de recursión infinita.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and rol = 'admin'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table periodos enable row level security;
alter table preguntas enable row level security;
alter table intentos enable row level security;
alter table practica_stats enable row level security;

-- PROFILES: cada usuario ve su propio perfil; el admin los ve todos.
create policy "usuario ve su propio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "admin ve todos los perfiles"
  on profiles for select
  using (public.is_admin());

-- (la creación/edición de usuarios se hace SIEMPRE desde el servidor con la
-- service_role key, que se salta RLS -> no hace falta policy de insert/update aquí)

-- PERIODOS: lectura pública (para saber si hay test abierto), escritura solo admin.
create policy "cualquiera puede leer periodos"
  on periodos for select
  using (true);

create policy "solo admin escribe periodos"
  on periodos for all
  using (public.is_admin())
  with check (public.is_admin());

-- PREGUNTAS: lectura pública (test oficial Y práctica), escritura solo admin.
create policy "cualquiera puede leer preguntas"
  on preguntas for select
  using (true);

create policy "solo admin escribe preguntas"
  on preguntas for all
  using (public.is_admin())
  with check (public.is_admin());

-- INTENTOS: el usuario solo ve/crea los suyos; el admin los ve todos.
create policy "usuario ve sus propios intentos"
  on intentos for select
  using (auth.uid() = usuario_id);

create policy "usuario crea su propio intento"
  on intentos for insert
  with check (auth.uid() = usuario_id);

create policy "admin ve todos los intentos"
  on intentos for select
  using (public.is_admin());

-- PRACTICA_STATS: cualquiera (incluso anónimo) puede INSERTAR (sumar +1),
-- pero solo el admin puede LEER el contador agregado.
create policy "cualquiera puede registrar una practica"
  on practica_stats for insert
  with check (true);

create policy "solo admin lee estadisticas de practica"
  on practica_stats for select
  using (public.is_admin());

-- ============================================================
-- Primer usuario admin (ejecutar UNA VEZ, después de crear el usuario
-- desde Supabase Auth o desde /api/admin/usuarios la primera vez a mano).
-- Sustituye el email por el del admin real:
-- update profiles set rol = 'admin' where id = (select id from auth.users where email = 'admin@tuclub.com');
-- ============================================================
