import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
    // Sin el servidor MCP de desarrollo: escribe cada mensaje de la consola del navegador en
    // .next/dev/logs, ese cambio dispara una recompilación y la página se recarga en bucle
    // ("✓ Compiled in 1ms" + GET /login sin parar). La app no lo usa.
    mcpServer: false,
  },
  cacheComponents: true,
  images: {
    // 90 para los banners del expediente (ilustraciones con degradados suaves).
    qualities: [75, 90],
  },
  partialPrefetching: true,
  // "/" lleva al login. Se hace aquí y no con redirect() en app/page.tsx, que en desarrollo fallaba
  // al validar la navegación instantánea de la ruta (P-73).
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
