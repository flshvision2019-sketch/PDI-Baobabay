export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7ee", borderRadius: 14, padding: 16, boxShadow: "0 6px 18px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        border: "none",
        borderRadius: 12,
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
        background: "#111827",
        color: "white",
        ...(props.style || {})
      }}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 12,
        border: "1px solid #d6d7e1",
        outline: "none",
        ...(props.style || {})
      }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 12,
        border: "1px solid #d6d7e1",
        outline: "none",
        background: "white",
        ...(props.style || {})
      }}
    />
  );
}
