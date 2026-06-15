import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getRedis } from "./redis";

const SALT_ROUNDS = 10;

export interface UserRecord {
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AppliedJob {
  url: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  appliedAt: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in environment variables.");
  return secret;
}

/** Hash a plain-text password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare plain-text vs hashed */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Issue a JWT session token (expires in 7 days) */
export function signToken(email: string): string {
  return jwt.sign({ email }, getJwtSecret(), { expiresIn: "7d" });
}

/** Verify a JWT and return the email, or null if invalid */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { email: string };
    return payload.email;
  } catch {
    return null;
  }
}

/** Redis key helpers */
const userKey = (email: string) => `user:${email.toLowerCase()}`;
const trackerKey = (email: string) => `tracker:${email.toLowerCase()}`;

/** Create a new user. Returns error string if email already exists. */
export async function createUser(email: string, password: string): Promise<{ error?: string }> {
  const redis = getRedis();
  const key = userKey(email);
  const existing = await redis.get<UserRecord>(key);
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await hashPassword(password);
  const user: UserRecord = { email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
  await redis.set(key, user);
  return {};
}

/** Verify credentials. Returns email on success or error string. */
export async function loginUser(email: string, password: string): Promise<{ email?: string; error?: string }> {
  const redis = getRedis();
  const user = await redis.get<UserRecord>(userKey(email));
  if (!user) return { error: "No account found with this email." };

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return { error: "Incorrect password." };

  return { email: user.email };
}

/** Save an applied job to the user's tracker list (max 200 entries). */
export async function addAppliedJob(email: string, job: AppliedJob): Promise<void> {
  const redis = getRedis();
  const key = trackerKey(email);
  await redis.lpush(key, job);
  await redis.ltrim(key, 0, 199); // keep latest 200
}

/** Fetch all applied jobs for a user */
export async function getAppliedJobs(email: string): Promise<AppliedJob[]> {
  const redis = getRedis();
  const key = trackerKey(email);
  const items = await redis.lrange<AppliedJob>(key, 0, -1);
  return items || [];
}
