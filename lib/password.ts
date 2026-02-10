import crypto from "crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await pbkdf2(password, salt);
  return `${salt}:${derived}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const derived = await pbkdf2(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}

function pbkdf2(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(key.toString("hex"));
    });
  });
}
