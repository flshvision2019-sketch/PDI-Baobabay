export const metadata = { title: "PDI Baobabay", description: "Aplicativo web de PDI com autosave e dashboard RH" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", margin: 0, background: "#f6f7fb" }}>
        {children}
      </body>
    </html>
  );
}
