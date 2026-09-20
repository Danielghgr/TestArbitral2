export default function HomePage() {
  return (
    <div className="card max-w-sm mx-auto mt-16 text-center">
      <img src="/logo.png" alt="FBM" className="w-24 mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-1">Test de Árbitros</h1>
      <p className="text-muted text-sm mb-8">FBM · Federación Baloncesto Madrid</p>

      <a href="/practica" className="block btn-primary mb-3">
        Practicar (sin login)
      </a>
      <a href="/login" className="block btn-secondary">
        Iniciar sesión (test oficial / admin)
      </a>
    </div>
  );
}
