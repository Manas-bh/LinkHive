import type { ZodError } from "zod";

export function getFirstZodErrorMessage(error: ZodError) {
  return error.issues[0]?.message || "Invalid request payload";
}
