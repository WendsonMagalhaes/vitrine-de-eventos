"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "./adminApi";
import { clearAllSessions } from "./authStore";

export function useAdminData<T = any>(path: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try { setData(await adminApi(path)); setError(""); }
    catch (e: any) {
      if (e.status === 401 || e.status === 403) { clearAllSessions(); router.replace("/login?next=/admin"); }
      else setError(e.message);
    } finally { setLoading(false); }
  }, [path, router]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload };
}
