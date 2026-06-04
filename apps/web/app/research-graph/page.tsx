export default function ResearchGraphPrototypePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        background: "#020617",
        color: "#ffffff",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.14)",
          paddingBottom: "12px",
        }}
      >
        <a
          href="/"
          style={{
            color: "#67e8f9",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back Home
        </a>

        <h1
          style={{
            margin: "6px 0 0",
            fontSize: "28px",
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          Research Graph Prototype
        </h1>
      </header>

      <section
        style={{
          flex: "1 1 auto",
          minHeight: "calc(100vh - 80px)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <iframe
          src="/prototypes/research-graph/research-graph.html"
          title="Research Graph Prototype"
          style={{
            display: "block",
            width: "100%",
            height: "calc(100vh - 80px)",
            minHeight: "calc(100vh - 80px)",
            border: "0",
            background: "#ffffff",
          }}
        />
      </section>
    </main>
  );
}
