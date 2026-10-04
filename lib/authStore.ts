// Sessão única do site. O mesmo token é guardado nas chaves de cada área (vitrine, fornecedor, admin),
// assim quem entra uma vez usa todas as áreas a que tem direito.
import { clientTokenKey, clientUserKey } from "./clientApi";
import { providerTokenKey } from "./providerApi";
import { tokenKey as adminTokenKey } from "./adminApi";

export type Role = "CLIENT" | "PROVIDER" | "ADMIN";
export type StoredUser = { id: string; name: string; email?: string; role: Role; provider?: { id: string; status: string; featured: boolean } | null };

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const del = (k: string) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } };

// Cada perfil tem a sua página inicial.
export const homeFor = (role: Role) => (role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/fornecedor" : "/app");

// Só aceita voltar para uma área a que o perfil pode ir (evita redirecionar para fora do site ou para área proibida).
export function allowedNext(role: Role, next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  const inArea = (p: string) => next === p || next.startsWith(p + "/") || next.startsWith(p + "?");
  if (role === "ADMIN") return inArea("/admin") ? next : null;
  if (role === "PROVIDER") return inArea("/fornecedor") || inArea("/app") ? next : null;
  return inArea("/app") ? next : null;
}
export const destinationFor = (role: Role, next?: string | null) => allowedNext(role, next) ?? homeFor(role);

export function storeSession(token: string, user: StoredUser) {
  set(clientTokenKey, token); set(clientUserKey, JSON.stringify(user));
  if (user.role === "PROVIDER") set(providerTokenKey, token); else del(providerTokenKey);
  if (user.role === "ADMIN") set(adminTokenKey, token); else del(adminTokenKey);
}
export function clearAllSessions() { [clientTokenKey, clientUserKey, providerTokenKey, adminTokenKey].forEach(del); }
export const anyStoredToken = () => get(clientTokenKey) ?? get(providerTokenKey) ?? get(adminTokenKey);
export function storedUser(): StoredUser | null { try { return JSON.parse(get(clientUserKey) ?? "null"); } catch { return null; } }
