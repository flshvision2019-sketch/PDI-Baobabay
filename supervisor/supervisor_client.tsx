"use client";
import { useEffect, useState } from "react";
import { Card } from "../_ui";

type Row = {
  employeeCode: string;
  name: string;
  storeCode: string;
  zone: string;
  position: string;
  totalScore: number;
  level: string;
  submittedAt: string | null;
};

export default function SupervisorClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/supervisor/evaluations");
      const data = await r.json();
      if (!r.ok) setMsg(data?.error ?? "Erro");
      setRows(data.rows ?? []);
    })();
  }, []);

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Submissões do ciclo atual</h3>
      {msg && <div style={{ fontWeight: 800 }}>{msg}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Mec.</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Nome</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Loja</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Zona</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Cargo</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Score</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Nível</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.employeeCode}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.name}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.storeCode}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.zone}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.position}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.totalScore}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.level}</td>
                <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
