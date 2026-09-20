import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Test de Árbitros - FBM",
  description: "Federación Baloncesto Madrid - Tests de árbitros"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
