// Pure password hashing helpers with no Next.js / server-only dependency,
// so standalone scripts (seed, one-off imports run via `tsx`) can use them
// without pulling in "server-only", "next/headers", or "next/navigation".
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
