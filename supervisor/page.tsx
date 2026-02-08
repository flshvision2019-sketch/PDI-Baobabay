import Nav from "../_nav";
import { Card } from "../_ui";
import SupervisorClient from "./supervisor_client";

export default async function SupervisorPage() {
  return (
    <main>
      <Nav role="SUPERVISOR" />
      <div style={{ maxWidth: 1100, margin: "20px auto", padding: 16, display: "grid", gap: 14 }}>
        <Card>
          <h2 style={{ marginTop: 0 }}>Supervisor • Visão por Loja/Zona</h2>
          <div style={{ opacity: 0.75 }}>Você vê apenas colaboradores da sua loja/zona.</div>
        </Card>
        <SupervisorClient />
      </div>
    </main>
  );
}
