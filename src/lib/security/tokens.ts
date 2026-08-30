import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function safeTokenInput(value: unknown) {
  const token = typeof value === "string" ? value.trim() : "";
  return token.length >= 32 && token.length <= 256 ? token : null;
}
