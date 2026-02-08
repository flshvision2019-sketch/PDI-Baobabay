"use client";
import { useState } from "react";
import { Button, Card, Input, Select } from "../_ui";

export default function LoginPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [zone, setZone] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setMsg(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeCode, storeCode, zone, password })
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Falha no login");
      return;
    }
    window.location.href = "/pdi";
  };

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <Card>
        <h2 style={{ marginTop: 0 }}>Login PDI</h2>
        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Nº mecanográfico</div>
            <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="Ex: 10001" />
          </label>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Código da loja</div>
            <Input value={storeCode} onChange={(e) => setStoreCode(e.target.value)} placeholder="Ex: Y17" />
          </label>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Zona</div>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex: KILAMBA" />
          </label>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Senha</div>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </label>

          {msg && <div style={{ color: "#b42318", fontWeight: 700 }}>{msg}</div>}

          <Button onClick={submit}>Entrar</Button>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Demo seed: (10001, Y17, KILAMBA, 123456) • Supervisor: 90001 • RH: 99001
          </div>
        </div>
      </Card>
    </main>
  );
}
