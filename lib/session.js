import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

/**
 * Encrypt a payload into a signed JWT (HS256, 7-day expiry).
 * Payload should contain minimal claims: { userId, role, name }.
 */
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

/**
 * Decrypt and verify a JWT string. Returns the payload or null.
 */
export async function decrypt(token) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a session cookie after successful authentication.
 * Stores userId, role, and name in the JWT — no sensitive PII.
 */
export async function createSession(user) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({
    userId: user.id,
    role: user.role,
    name: user.name,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return token;
}

/**
 * Read and verify the session from a Next.js API Route Handler request.
 * Returns the decoded session payload { userId, role, name } or null.
 *
 * Works with both:
 *   - The incoming Request object (reads Cookie header directly)
 *   - The Next.js cookies() API (fallback)
 */
export async function getSession(request) {
  let token = null;

  // Try extracting from the Request Cookie header first
  if (request?.headers) {
    const cookieHeader = request.headers.get?.("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
    if (match) token = match[1];
  }

  // Fallback: use the cookies() API
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("session")?.value;
    } catch {
      // cookies() may throw outside of a request context
    }
  }

  if (!token) return null;
  return decrypt(token);
}

/**
 * Delete the session cookie (logout).
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
