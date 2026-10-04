import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { ZodError } from "zod";

export type Role = "CLIENT" | "PROVIDER" | "ADMIN";
export type Session = { sub: string; role: Role };
const key = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export const signToken = (s: Session) =>
  new SignJWT({ role: s.role }).setSubject(s.sub).setIssuedAt()
    .setExpirationTime("30d").setProtectedHeader({ alg: "HS256" }).sign(key());

async function session(req: NextRequest): Promise<Session | null> {
  const t = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    return { sub: payload.sub!, role: payload.role as Role };
  } catch { return null; }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

// roles = null: rota pública. roles = [...]: exige login e papel permitido (validado no servidor).
export function route(
  roles: Role[] | null,
  handler: (req: NextRequest, ctx: any, s: Session) => Promise<Response>
) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const s = await session(req);
      if (roles && !s) return json({ error: "Não autenticado" }, 401);
      if (roles && s && !roles.includes(s.role)) return json({ error: "Sem permissão" }, 403);
      return await handler(req, ctx, s as Session);
    } catch (e) {
      if (e instanceof ZodError) return json({ error: "Dados inválidos", details: e.flatten() }, 400);
      console.error(e);
      return json({ error: "Erro interno" }, 500);
    }
  };
}
