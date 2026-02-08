import Nav from "../_nav";
import { Card } from "../_ui";
import AdminClient from "./admin_client";

export default async function AdminPage() {
  return (
    <main>
      <Nav role="HR_ADMIN" />
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: 16, display: "grid", gap: 14 }}>
        <Card>
          <h2 style={{ marginTop: 0 }}>RH/Admin Dashboard</h2>
          <div style={{ opacity: 0.75 }}>Filtros por loja/zona/cargo, ranking e export Excel/PDF. Retake apaga a submissão anterior.</div>
        </Card>
        <AdminClient />
      </div>
    </main>
  );
}
