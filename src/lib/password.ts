import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const algorithm = "scrypt";
const saltBytes = 16;
const keyLength = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltBytes).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return `${algorithm}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    const parts = passwordHash.split(":");

    if (parts.length !== 3) {
      return false;
    }

    const [storedAlgorithm, salt, hash] = parts;

    if (storedAlgorithm !== algorithm || !salt || !hash) {
      return false;
    }

    const storedKey = Buffer.from(hash, "hex");

    if (storedKey.length !== keyLength) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}
