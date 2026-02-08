"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Select } from "../_ui";

type RubricItem = {
  id: string;
  category: string;
  question: string;
  description?: string | null;
  options: { id: string; label: string; points: number }[];
};

export default function PDIClient() {
  const [items, setItems] = useState<RubricItem[]>([]);
  const [rubricId, setRubricId] = useState<string>("");
  const [evaluationId, setEvaluationId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/rubric/me");
      const data = await r.json();
      setItems(data.items);
      setRubricId(data.rubricId);
      setEvaluationId(data.evaluationId);

      const d = await fetch("/api/draft/load");
      if (d.ok) {
        const dj = await d.json();
        if (dj?.answersJson) setAnswers(dj.answersJson);
        if (typeof dj?.progress === "number") setProgress(dj.progress);
      }
    })();
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  useEffect(() => {
    if (!items.length) return;
    const p = Math.round((answeredCount / items.length) * 100);
    setProgress(p);
  }, [answeredCount, items.length]);

  useEffect(() => {
    const t = setInterval(() => { void saveDraft(); }, 120000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId, progress, answers]);

  useEffect(() => {
    const t = setTimeout(() => { void saveDraft(); }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, progress]);

  const saveDraft = async () => {
    if (!evaluationId) return;
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await fetch("/api/draft/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId, answersJson: answers, progress })
      });
      setMsg("Rascunho guardado automaticamente.");
      setTimeout(() => setMsg(null), 2000);
    } finally {
      savingRef.current = false;
    }
  };

  const submit = async () => {
    setMsg(null);
    const payload = { evaluationId, rubricId, answers: Object.entries(answers).map(([itemId, optionId]) => ({ itemId, optionId })) };
    const res = await fetch("/api/evaluations/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setMsg(data?.error ?? "Falha ao submeter"); return; }
    setMsg(`Submetido! Pontuação: ${data.totalScore} • Nível: ${data.level}`);
  };

  if (!items.length) return <Card><div>Carregando PDI...</div></Card>;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0 }}>Avaliação (PDI)</h3>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Progresso: {progress}%</div>
        </div>
        <Button onClick={submit} disabled={progress < 70} title={progress < 70 ? "Complete pelo menos 70% para submeter (ajustável)" : ""}>
          Terminar e Submeter
        </Button>
      </div>

      {msg && <div style={{ marginTop: 10, fontWeight: 800 }}>{msg}</div>}

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div key={it.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{it.category}</div>
            <div style={{ fontWeight: 900, marginTop: 6 }}>{it.question}</div>
            {it.description && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{it.description}</div>}
            <div style={{ marginTop: 10 }}>
              <Select value={answers[it.id] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [it.id]: e.target.value }))}>
                <option value="" disabled>Selecionar...</option>
                {it.options.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
              </Select>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
