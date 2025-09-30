import { jwtVerify, SignJWT } from 'jose';
import type { User } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'poker-secret-key-change-in-production'
);

export interface JWTPayload {
  user: User;
  iat?: number;
  exp?: number;
}

// ===== VERIFICAR TOKEN JWT =====
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token inválido:', error);
    return null;
  }
}

// ===== CRIAR TOKEN JWT =====
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token válido por 7 dias
    .sign(JWT_SECRET);
  
  return token;
}

// ===== OBTER TOKEN DO COOKIE/LOCALSTORAGE =====
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// ===== SALVAR TOKEN =====
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

// ===== REMOVER TOKEN =====
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

// ===== OBTER USUÁRIO DO TOKEN =====
export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  return payload?.user || null;
}

// ===== VERIFICAR SE ESTÁ AUTENTICADO =====
export async function isAuthenticated(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  
  const payload = await verifyToken(token);
  return !!payload;
}

// ===== VERIFICAR ROLE =====
export async function hasRole(role: string | string[]): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  
  const payload = await verifyToken(token);
  if (!payload?.user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(payload.user.role);
}

