// Suppress DEP0169: url.parse() deprecation warning from openid-client (next-auth dependency)
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (
    warning.name === "DeprecationWarning" &&
    /** @type {any} */ (warning).code === "DEP0169"
  )
    return;
  process.emitWarning(warning);
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.18.53"],
};

export default nextConfig;
