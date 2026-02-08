import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>PDI Baobabay</h1>
      <p style={{ opacity: 0.8 }}>Acesse para fazer o seu PDI ou ver o dashboard.</p>
      <ul>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/pdi">PDI (requer login)</Link></li>
        <li><Link href="/supervisor">Supervisor (requer login)</Link></li>
        <li><Link href="/admin">RH/Admin (requer login)</Link></li>
      </ul>
    </main>
  );
}
