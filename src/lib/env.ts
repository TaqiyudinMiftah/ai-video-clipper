// Centralized environment-variable access helpers.
// Single source of truth for reading/coercing process.env values.

/** Return an env var value, throwing if it is missing or empty. */
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is required.`);
  }

  return value;
}

/** Parse a positive (> 0) finite number env var, else return `fallback`. */
export function getPositiveNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Parse a positive (> 0) integer env var, else return `fallback`. */
export function getPositiveIntegerEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
