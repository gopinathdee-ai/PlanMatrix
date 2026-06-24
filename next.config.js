/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This is the modern way to handle Knex and other server-side libraries 
  // that have dynamic requirements. It works for both Webpack and Turbopack.
  serverExternalPackages: ["knex"],
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
