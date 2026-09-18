import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "team-pulse-super-secret-jwt-key-2026";
export const COOKIE_NAME = "team_pulse_session";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function logAudit(
  organizationId: string,
  userId: string,
  userEmail: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        userEmail,
        action,
        entity,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    console.error("Failed to log audit entry:", err);
  }
}
