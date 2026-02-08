import Nav from "../_nav";
import { Card } from "../_ui";
import PDIClient from "./pdi_client";
import { prisma } from "../../src/lib/prisma";
import { cookies } from "next/headers";
import { getCookieName, verifySession } from "../../src/lib/auth";

export default async function PDIPage() {
  const token = cookies().get(getCookieName())?.value!;
  const session = await verifySession(token);
  const user = await prisma.user.findUnique({ where: { id: session.uid } });

  return (
    <main>
      <Nav role={session.role} />
      <div style={{ maxWidth: 980, margin: "20px auto", padding: 16, display: "grid", gap: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Colaborador</div>
              <div style={{ fontWeight: 900 }}>{user?.name} • {user?.employeeCode}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Loja/Zona/Cargo</div>
              <div style={{ fontWeight: 900 }}>{user?.storeCode} • {user?.zone} • {user?.position}</div>
            </div>
          </div>
        </Card>

        <PDIClient />
      </div>
    </main>
  );
}
