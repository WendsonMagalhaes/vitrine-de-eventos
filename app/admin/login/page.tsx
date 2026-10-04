import { redirect } from "next/navigation";
// A tela de login agora é única: /login.
export default function AdminLogin() { redirect("/login?next=/admin"); }
