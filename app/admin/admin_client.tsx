"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Select } from "../_ui";

type Row = {
  evaluationId: string;
  employeeCode: string;
  name: string;
  storeCode: string;
  zone: string;
  position: string;
  totalScore: number;
  level: string;
  status: string;
  submittedAt: string | null;
};

export default function AdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
const [kpis, setKpis] = useState<any>(null);


  const [cycleKey, setCycleKey] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [zone, setZone] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string>("");

  const load = async () => {
    setMsg("");
    const qs = new URLSearchParams();
    if (cycleKey) qs.set("cycleKey", cycleKey);
    if (storeCode) qs.set("storeCode", storeCode);
    if (zone) qs.set("zone", zone);
    if (position) qs.set("position", position);
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);

    const r = await fetch(`/api/admin/evaluations?${qs.toString()}`);
    const data = await r.json();
    const k = await fetch("/api/admin/kpis").then(r=>r.json()).catch(()=>null);
    setKpis(k);
    if (!r.ok) setMsg(data?.error ?? "Erro");
    setRows(data.rows ?? []);
    if (data.cycleKey) setCycleKey(data.cycleKey);
  };

  useEffect(() => { void load(); }, []);

  const exportExcel = () => {
    const qs = new URLSearchParams();
    if (cycleKey) qs.set("cycleKey", cycleKey);
    if (storeCode) qs.set("storeCode", storeCode);
    if (zone) qs.set("zone", zone);
    if (position) qs.set("position", position);
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    window.open(`/api/admin/export/excel?${qs.toString()}`, "_blank");
  };

  const exportPdf = () => {
    const qs = new URLSearchParams();
    if (cycleKey) qs.set("cycleKey", cycleKey);
    if (storeCode) qs.set("storeCode", storeCode);
    if (zone) qs.set("zone", zone);
    if (position) qs.set("position", position);
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    window.open(`/api/admin/export/pdf?${qs.toString()}`, "_blank");
  };

  const allowRetake = async (employeeCode: string) => {
    setMsg("");
    const r = await fetch("/api/admin/retake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeCode, cycleKey })
    });
    const data = await r.json();
    const k = await fetch("/api/admin/kpis").then(r=>r.json()).catch(()=>null);
    setKpis(k);
    if (!r.ok) setMsg(data?.error ?? "Erro");
    else setMsg("Retake liberado (submissão anterior apagada).");
    await load();
  };

  const top = useMemo(() => [...rows].sort((a,b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)).slice(0, 10), [rows]);

  return (
    <Card>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Ciclo (YYYY-MM)</div>
            <Input value={cycleKey} onChange={(e)=>setCycleKey(e.target.value)} placeholder="Ex: 2026-02" />
          </label>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Loja</div>
            <Input value={storeCode} onChange={(e)=>setStoreCode(e.target.value)} placeholder="Y17" />
          </label>
          <label>
  <div style={{ fontSize: 12, opacity: 0.8 }}>Zona</div>
  <Select value={zone} onChange={(e)=>setZone(e.target.value)}>
    <option value="">(todas)</option>
    <option value="KILAMBA">KILAMBA</option>
    <option value="CIDADE">CIDADE</option>
    <option value="TALATONA">TALATONA</option>
    <option value="VIANA">VIANA</option>
    <option value="CAMAMA">CAMAMA</option>
    <option value="PROVINCIAS">PROVINCIAS</option>
  </Select>
</label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Cargo</div>
            <Input value={position} onChange={(e)=>setPosition(e.target.value)} placeholder="PROMOTOR" />
          </label>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Status</div>
            <Select value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="">(todos)</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="DRAFT">DRAFT</option>
            </Select>
          </label>
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Pesquisar</div>
            <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="nome ou mecanográfico" />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={load}>Aplicar filtros</Button>
          <Button onClick={exportExcel} style={{ background: "#065f46" }}>Export Excel</Button>
          <Button onClick={exportPdf} style={{ background: "#7c2d12" }}>Export PDF</Button>
        </div>

        {msg && <div style={{ fontWeight: 900 }}>{msg}</div>}

{kpis && !kpis.error && (
  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
    <h3 style={{ margin: "10px 0" }}>KPIs do Ciclo</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
      {[
        ["Ativos", kpis.totals.totalUsers],
        ["Submetidos", kpis.totals.submitted],
        ["Rascunhos", kpis.totals.drafts],
        ["Pendentes", kpis.totals.pending],
        ["Média Score", kpis.totals.avgScore],
      ].map(([t,v]: any, idx: number) => (
        <div key={idx} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10, background: "#fafafa" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{t}</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{v}</div>
        </div>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Distribuição por Nível</div>
        {kpis.byLevel?.map((b: any, i: number) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 50px", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{b.label}</div>
            <div style={{ height: 10, background: "#eee", borderRadius: 999 }}>
              <div style={{ height: 10, width: `${Math.min(100, (b.value / Math.max(1, kpis.totals.submitted)) * 100)}%`, background: "#111827", borderRadius: 999 }} />
            </div>
            <div style={{ fontWeight: 800, textAlign: "right" }}>{b.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Submissões por Zona</div>
        {kpis.byZone?.map((b: any, i: number) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 50px", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{b.label}</div>
            <div style={{ height: 10, background: "#eee", borderRadius: 999 }}>
              <div style={{ height: 10, width: `${Math.min(100, (b.value / Math.max(1, kpis.totals.submitted)) * 100)}%`, background: "#065f46", borderRadius: 999 }} />
            </div>
            <div style={{ fontWeight: 800, textAlign: "right" }}>{b.value}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}



        <div style={{ marginTop: 8 }}>
          <h3 style={{ margin: "10px 0" }}>Ranking Top 10</h3>
          <ol>
            {top.map((r) => (
              <li key={r.evaluationId}>{r.name} ({r.employeeCode}) • {r.storeCode}/{r.zone} • {r.totalScore} • {r.level}</li>
            ))}
          </ol>
        </div>

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
                <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Status</th>
                <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.evaluationId}>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.employeeCode}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.name}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.storeCode}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.zone}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.position}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.totalScore}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.level}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>{r.status}</td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>
                    <button
                      onClick={() => allowRetake(r.employeeCode)}
                      style={{ border: "1px solid #ddd", background: "white", borderRadius: 10, padding: "6px 8px", cursor: "pointer" }}
                    >
                      Permitir retake (apagar)
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={9} style={{ padding: 12, opacity: 0.7 }}>Sem resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
