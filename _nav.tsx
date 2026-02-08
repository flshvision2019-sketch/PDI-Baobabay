"use client";
import Link from "next/link";

export default function Nav({ role }: { role?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 14, background: "white", borderBottom: "1px solid #e7e7ee" }}>
      <div style={{ fontWeight: 900 }}>PDI Baobabay</div>
      <Link href="/pdi">PDI</Link>
      {(role === "SUPERVISOR" || role === "HR_ADMIN") && <Link href="/supervisor">Supervisor</Link>}
      {role === "HR_ADMIN" && <Link href="/admin">RH/Admin</Link>}
      <div style={{ marginLeft: "auto" }}>
        <button
          onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
          style={{ border: "1px solid #ddd", background: "white", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
