import { useState, useEffect } from "react";

// ── DATA ──────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@studiobiblico.com";
const AT = ["Gênesis","Êxodo","Levítico","Números","Deuteronômio","Josué","Juízes","Rute","1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias","Ester","Jó","Salmos","Provérbios","Eclesiastes","Cantares","Isaías","Jeremias","Lamentações","Ezequiel","Daniel","Oseias","Joel","Amós","Obadias","Jonas","Miquéias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias"];
const NT = ["Mateus","Marcos","Lucas","João","Atos","Romanos","1 Coríntios","2 Coríntios","Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","2 Timóteo","Tito","Filemom","Hebreus","Tiago","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas","Apocalipse"];
const CAPS = {"Gênesis":50,"Êxodo":40,"Levítico":27,"Números":36,"Deuteronômio":34,"Josué":24,"Juízes":21,"Rute":4,"1 Samuel":31,"2 Samuel":24,"1 Reis":22,"2 Reis":25,"1 Crônicas":29,"2 Crônicas":36,"Esdras":10,"Neemias":13,"Ester":10,"Jó":42,"Salmos":150,"Provérbios":31,"Eclesiastes":12,"Cantares":8,"Isaías":66,"Jeremias":52,"Lamentações":5,"Ezequiel":48,"Daniel":12,"Oseias":14,"Joel":3,"Amós":9,"Obadias":1,"Jonas":4,"Miquéias":7,"Naum":3,"Habacuque":3,"Sofonias":3,"Ageu":2,"Zacarias":14,"Malaquias":4,"Mateus":28,"Marcos":16,"Lucas":24,"João":21,"Atos":28,"Romanos":16,"1 Coríntios":16,"2 Coríntios":13,"Gálatas":6,"Efésios":6,"Filipenses":4,"Colossenses":4,"1 Tessalonicenses":5,"2 Tessalonicenses":3,"1 Timóteo":6,"2 Timóteo":4,"Tito":3,"Filemom":1,"Hebreus":13,"Tiago":5,"1 Pedro":5,"2 Pedro":3,"1 João":5,"2 João":1,"3 João":1,"Judas":1,"Apocalipse":22};
const VERSOES = ["ARC","ARA","NVI","NAA","NVT","NTLH"];

// ── API ───────────────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 1800) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── VERSE REGEX ───────────────────────────────────────────────────────
const VERSE_RE = /\b(Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|[12]\s*Samuel|[12]\s*Reis|[12]\s*Crônicas|Esdras|Neemias|Ester|Jó|Salmos|Provérbios|Eclesiastes|Cantares|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oseias|Joel|Amós|Obadias|Jonas|Miquéias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|[12]\s*Coríntios|Gálatas|Efésios|Filipenses|Colossenses|[12]\s*Tessalonicenses|[12]\s*Timóteo|Tito|Filemom|Hebreus|Tiago|[123]\s*Pedro|[123]\s*João|Judas|Apocalipse)\s+\d+:\d+[-\d]*/gi;

function linkVerses(text, onClick) {
  const parts = text.split(VERSE_RE);
  // simpler: just replace inline
  return text.replace(VERSE_RE, (m) =>
    `<span class="vlink" data-ref="${m}" style="color:#7C3AED;font-weight:800;text-decoration:underline;cursor:pointer;background:rgba(124,58,237,0.1);padding:1px 4px;border-radius:4px">${m}</span>`
  );
}

// ── COMPONENTS ────────────────────────────────────────────────────────

function Spinner({ msg = "Gerando com IA... 🙏" }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
      <div style={{ width: 48, height: 48, border: "4px solid #f0e6ff", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 16, color: "#7C3AED", fontWeight: 800 }}>{msg}</p>
    </div>
  );
}

// ── RESULT VIEWER (estilo do PDF) ────────────────────────────────────
function ResultViewer({ content, title, type, userName, isDevocional, onBack, onHome }) {
  const [vpOpen, setVpOpen] = useState(false);
  const [vpRef, setVpRef] = useState("");
  const [vpVer, setVpVer] = useState("ARC");
  const [vpText, setVpText] = useState("");
  const [vpLoading, setVpLoading] = useState(false);

  function handleClick(e) {
    const ref = e.target.dataset?.ref;
    if (ref) openVerse(ref);
  }

  async function openVerse(ref) {
    setVpRef(ref); setVpOpen(true); setVpLoading(true); setVpText("");
    try {
      const txt = await callClaude(
        `Forneça o texto de ${ref} na versão ${vpVer} em português.\nDepois escreva "---R---" e uma reflexão de 2 linhas para jovem cristão pentecostal de 10-15 anos.`, 400
      );
      setVpText(txt);
    } catch { setVpText("Erro ao buscar versículo."); }
    setVpLoading(false);
  }

  async function changeVer(v) {
    setVpVer(v);
    if (!vpRef) return;
    setVpLoading(true);
    try {
      const txt = await callClaude(
        `Forneça o texto de ${vpRef} na versão ${v} em português.\nDepois escreva "---R---" e uma reflexão de 2 linhas para jovem cristão pentecostal de 10-15 anos.`, 400
      );
      setVpText(txt);
    } catch { setVpText("Erro ao buscar versículo."); }
    setVpLoading(false);
  }

  function playAudio() {
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    const el = document.getElementById("resultContent");
    if (!el) return;
    const utt = new SpeechSynthesisUtterance(el.innerText.substring(0, 3500));
    utt.lang = "pt-BR"; utt.rate = 0.88;
    speechSynthesis.speak(utt);
  }

  function doPDF() {
    const el = document.getElementById("resultContent");
    if (!el) return;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Nunito',sans-serif;max-width:800px;margin:0 auto;padding:40px 32px;color:#1a1a2e;line-height:1.7;font-size:15px;background:#fff}
      .header{text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #7C3AED}
      .header h1{font-size:28px;font-weight:900;color:#7C3AED;margin-bottom:4px}
      .header p{color:#888;font-size:13px;font-weight:700}
      h1{font-size:26px;font-weight:900;color:#1a1a2e;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #f0e6ff}
      h2{font-size:20px;font-weight:800;color:#7C3AED;margin:20px 0 10px}
      h3{font-size:17px;font-weight:800;color:#5B21B6;margin:16px 0 8px}
      p{margin-bottom:12px;color:#1a1a2e}
      blockquote{border-left:4px solid #7C3AED;padding:12px 20px;background:#f5f0ff;border-radius:0 12px 12px 0;margin:16px 0;font-style:italic;color:#5B21B6;font-weight:700;font-size:16px}
      strong{color:#7C3AED;font-weight:900}
      li{margin-bottom:8px;margin-left:20px}
      ul,ol{margin:12px 0;padding-left:8px}
      .vlink{color:#7C3AED;font-weight:800;text-decoration:underline}
      @media print{a{color:#7C3AED}}
    </style></head><body>
    <div class="header"><h1>✝ Studio Bíblico — Deus Presente</h1><p>${userName} • ${type} • ${new Date().toLocaleDateString("pt-BR")}</p></div>
    ${el.innerHTML}
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 700);
  }

  const htmlContent = content
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/(<li>.*<\/li>(\n)?)+/gs, (m) => `<ul>${m}</ul>`);

  const linkedContent = ("<p>" + htmlContent + "</p>").replace(VERSE_RE, (m) =>
    `<span class="vlink" data-ref="${m}" style="color:#7C3AED;font-weight:800;text-decoration:underline;cursor:pointer;background:rgba(124,58,237,0.1);padding:1px 5px;border-radius:5px">${m}</span>`
  );

  const vpParts = vpText.split("---R---");

  return (
    <div style={{ position: "relative" }}>
      {/* Verse Side Panel */}
      <div style={{ position: "fixed", right: 0, top: 0, height: "100%", width: 300, background: "#fff", borderLeft: "3px solid #7C3AED", transform: vpOpen ? "translateX(0)" : "translateX(100%)", transition: "transform .3s", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(124,58,237,.2)" }}>
        <div style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", padding: "16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", flex: 1 }}>📖 {vpRef || "Versículo"}</div>
          <button onClick={() => setVpOpen(false)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", fontSize: 16, cursor: "pointer", padding: "4px 8px", fontWeight: 900 }}>✕</button>
        </div>
        <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Versão da Bíblia</div>
          <select value={vpVer} onChange={e => changeVer(e.target.value)} style={{ width: "100%", background: "#f5f0ff", border: "2px solid #7C3AED", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#3B0764", fontFamily: "'Nunito',sans-serif", marginBottom: 14, appearance: "none", fontWeight: 700 }}>
            {VERSOES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {vpLoading ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ width: 36, height: 36, border: "3px solid #f0e6ff", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
              <p style={{ color: "#7C3AED", fontSize: 13, fontWeight: 700 }}>Buscando versículo...</p>
            </div>
          ) : vpText ? (
            <>
              <div style={{ background: "#7C3AED", color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800, display: "inline-block", marginBottom: 12 }}>{vpRef} • {vpVer}</div>
              <div style={{ fontFamily: "'Lora',serif", fontSize: 16, lineHeight: 1.9, color: "#1a1a2e", fontStyle: "italic", marginBottom: 16, background: "#f9f5ff", padding: 16, borderRadius: 12, borderLeft: "4px solid #7C3AED" }}>"{vpParts[0]?.trim()}"</div>
              {vpParts[1] && (
                <div style={{ background: "#fef9c3", border: "2px solid #F59E0B", borderRadius: 10, padding: 12, fontSize: 13, color: "#78350F", lineHeight: 1.6 }}>
                  <strong style={{ color: "#92400E", display: "block", marginBottom: 5, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>💡 Reflexão para você</strong>
                  {vpParts[1].trim()}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: "#9D8EC0", fontSize: 13, fontWeight: 700 }}>Clique em um versículo azul no estudo 📖</p>
          )}
        </div>
      </div>

      {/* Top bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: "#f0e6ff", border: "2px solid #7C3AED", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Voltar</button>
        {isDevocional && (
          <button onClick={playAudio} style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            🎙️ Ouvir narração
          </button>
        )}
        <button onClick={doPDF} style={{ background: "linear-gradient(135deg,#10B981,#059669)", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>📄 Baixar PDF</button>
        <button onClick={onHome} style={{ background: "#f5f5f5", border: "2px solid #ddd", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 800, color: "#666", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🏠 Início</button>
      </div>

      {/* Content - estilo do PDF */}
      <div id="resultContent" onClick={handleClick}
        style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 30px rgba(0,0,0,0.08)", lineHeight: 1.8, fontFamily: "'Nunito',sans-serif" }}
        dangerouslySetInnerHTML={{ __html: `
          <style>
            #resultContent h1{font-size:28px;font-weight:900;color:#1a1a2e;margin:28px 0 14px;padding-bottom:10px;border-bottom:3px solid #f0e6ff;display:flex;align-items:center;gap:8px}
            #resultContent h2{font-size:21px;font-weight:800;color:#7C3AED;margin:24px 0 10px}
            #resultContent h3{font-size:17px;font-weight:800;color:#5B21B6;margin:18px 0 8px}
            #resultContent p{font-size:15px;color:#1a1a2e;margin-bottom:12px;line-height:1.8}
            #resultContent blockquote{border-left:5px solid #7C3AED;padding:14px 20px;background:#f5f0ff;border-radius:0 14px 14px 0;margin:16px 0;font-style:italic;color:#5B21B6;font-weight:700;font-size:16px}
            #resultContent strong{color:#7C3AED;font-weight:900}
            #resultContent li{font-size:15px;color:#1a1a2e;margin-bottom:8px;margin-left:20px;line-height:1.7}
            #resultContent ul,#resultContent ol{margin:12px 0}
          </style>
          ${linkedContent}
        ` }}
      />
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [savedEmails, setSavedEmails] = useState([ADMIN_EMAIL]);

  useEffect(() => {
    window.storage?.get("sb_emails").then(r => { if (r?.value) setSavedEmails(JSON.parse(r.value)); }).catch(() => {});
  }, []);

  function tryLogin() {
    if (!name.trim() || name.trim().length < 2) { setErr("✋ Digite seu nome (mínimo 2 letras)"); return; }
    const em = email.trim().toLowerCase();
    if (!em || !em.includes("@")) { setErr("✋ Digite um e-mail válido"); return; }
    const isAdmin = em === ADMIN_EMAIL;
    const allowed = isAdmin || savedEmails.map(x => x.toLowerCase()).includes(em);
    if (!allowed) { setErr("🚫 E-mail não autorizado. Solicite acesso ao administrador."); return; }
    onLogin({ name: name.trim(), email: em, isAdmin });
  }

  const inp = { width: "100%", background: "#f5f0ff", border: "2px solid #C4B5FD", borderRadius: 14, padding: "14px 16px", fontSize: 15, color: "#1a1a2e", fontFamily: "'Nunito',sans-serif", display: "block", marginBottom: 14, outline: "none", boxSizing: "border-box", fontWeight: 700 };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f9f5ff" }}>
      <div style={{ background: "#fff", borderRadius: 28, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(124,58,237,.15)", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✝️</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#7C3AED", marginBottom: 6 }}>Studio Bíblico</h1>
        <p style={{ fontSize: 14, color: "#9D8EC0", marginBottom: 28, fontWeight: 700 }}>Bem-vindo(a)! Entre pra começar 🙏</p>

        <label style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", textAlign: "left", display: "block", marginBottom: 6 }}>Seu nome</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Ex: João Silva" onKeyDown={e => e.key === "Enter" && tryLogin()} />

        <label style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", textAlign: "left", display: "block", marginBottom: 6 }}>Seu e-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inp} placeholder="seu@email.com" onKeyDown={e => e.key === "Enter" && tryLogin()} />

        {err && <div style={{ background: "#FFF1F2", color: "#BE123C", border: "2px solid #FDA4AF", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 800, marginBottom: 12, textAlign: "left" }}>{err}</div>}

        <button onClick={tryLogin} style={{ width: "100%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", letterSpacing: .5, marginTop: 4 }}>
          Entrar 🙏
        </button>
        <p style={{ fontSize: 11, color: "#C4B5FD", marginTop: 16, fontWeight: 700 }}>Admin: admin@studiobiblico.com</p>
      </div>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────
function HomeScreen({ user, onGo }) {
  const cards = [
    { id: "livro", icon: "📖", name: "Estudo por Livro", desc: "Explore capítulos da Bíblia", bg: "linear-gradient(135deg,#7C3AED,#A855F7)" },
    { id: "plano", icon: "📅", name: "Plano de Leitura", desc: "Leia com cronograma", bg: "linear-gradient(135deg,#F59E0B,#F97316)" },
    { id: "quiz", icon: "🎯", name: "Quiz Bíblico", desc: "Teste seus conhecimentos", bg: "linear-gradient(135deg,#10B981,#059669)" },
    { id: "dev", icon: "🕯️", name: "Devocional Diário", desc: "Reflexão + narração por voz", bg: "linear-gradient(135deg,#3B82F6,#6366F1)" },
    { id: "esb", icon: "✍️", name: "Esboço de Sermão", desc: "Prepare sua mensagem", bg: "linear-gradient(135deg,#EC4899,#E879F9)" },
    ...(user.isAdmin ? [{ id: "adm", icon: "⚙️", name: "Painel Admin", desc: "Gerencie os acessos", bg: "linear-gradient(135deg,#EF4444,#DC2626)" }] : []),
  ];

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7,#E879F9)", padding: "28px 20px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🔥</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0 }}>E aí, {user.name.split(" ")[0]}! ✌️</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.85)", margin: "8px 0 0", fontWeight: 700 }}>Tudo na santa paz? Bora estudar a Palavra!</p>
        <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 16, padding: "14px 18px", margin: "16px 0 0", textAlign: "left", backdropFilter: "blur(10px)" }}>
          <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: 14, color: "#fff", lineHeight: 1.6, margin: 0 }}>"Não te mandei eu? Sê forte e corajoso! Não te aterrorizes, nem te desanimes, porque o Senhor, teu Deus, está contigo."</p>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 800, display: "block", marginTop: 6 }}>Josué 1:9 • Versículo do dia ⚡</span>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: "20px 16px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#9D8EC0", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>O que você quer fazer hoje?</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {cards.map(c => (
            <div key={c.id} onClick={() => onGo(c.id)}
              style={{ background: "#fff", borderRadius: 20, padding: 18, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "2px solid #f0e6ff", transition: "transform .15s" }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#1a1a2e", marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#9D8EC0", fontWeight: 700 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LIVRO ─────────────────────────────────────────────────────────────
function LivroScreen({ user, onBack }) {
  const [step, setStep] = useState(0);
  const [livro, setLivro] = useState("");
  const [cap, setCap] = useState(0);
  const [rec, setRec] = useState([]);
  const [ver, setVer] = useState("ARC");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const recursos = ["Resumo do capítulo", "Contexto histórico", "Perguntas guiadas", "Palavras-chave", "Referências cruzadas", "Aplicação prática"];

  async function generate() {
    setLoading(true);
    try {
      const rec_str = rec.length ? rec.join(", ") : "resumo e aplicação prática";
      const txt = await callClaude(
        `Você é um mentor bíblico pentecostal apaixonado para jovens de 10-15 anos — linguagem JOVEM, animada, com emojis, gírias cristãs (tipo o PDF de referência).

Gere um estudo bíblico de ${livro} capítulo ${cap} na versão ${ver}.
Inclua: ${rec_str}.

ESTRUTURA OBRIGATÓRIA (igual ao PDF de referência):
# 1. Fala, ${user.name}! ✌️ 😎
[saudação animada e jovem, chame pelo nome, use gírias cristãs, emojis]

# 2. O que tá rolando? 🤔 📖
[contexto histórico de forma jovem, explique a situação do texto]

# 3. Os pontos principais 🔥 ✨
[3-4 pontos com **negrito**, emojis, listas, linguagem jovem]

# 4. Conexão Espírito Santo 🕊️ 🔥
[aplicação pentecostal, falar sobre o Espírito Santo, discernimento]

# 5. Desafio Radical 🛹 ⚡
[2-3 desafios práticos numerados para a semana]

# 6. Versículo pra postar 📸 ✨
[versículo principal em blockquote com referência, hashtags cristãs]

Use markdown com # para seções numeradas, **negrito**, > para versículos, listas com -
Referencie versículos no formato "Livro cap:ver" para que sejam clicáveis.
Seja transformador, animado e pentecostal!`
      );
      setResult(txt);
    } catch { alert("Erro ao gerar. Tente novamente."); }
    setLoading(false);
  }

  const sBtn = (disabled) => ({ flex: 1, background: disabled ? "#E9D5FF" : "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 800, color: disabled ? "#9D8EC0" : "#fff", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Nunito',sans-serif" });
  const bBtn = { background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" };

  if (result) return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <ResultViewer content={result} title={`${livro} ${cap}`} type="Estudo por Livro" userName={user.name} isDevocional={false} onBack={() => setResult(null)} onHome={onBack} />
    </div>
  );

  if (loading) return <div style={{ flex: 1, background: "#f9f5ff" }}><Spinner msg={`Gerando estudo de ${livro} ${cap}... 🙏`} /></div>;

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={bBtn}>← Voltar</button>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1a1a2e" }}>📖 Estudo por Livro</div>
      </div>

      {/* Step bar */}
      <div style={{ display: "flex", gap: 5, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < step ? "#7C3AED" : i === step ? "#A855F7" : "#E9D5FF" }} />)}
      </div>

      {step === 0 && <>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9D8EC0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Passo 1 de 4</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", marginBottom: 14 }}>Qual livro você quer estudar?</div>

        {[["📜 Antigo Testamento", AT], ["✝️ Novo Testamento", NT]].map(([label, books]) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", margin: "14px 0 8px" }}>{label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, maxHeight: 200, overflowY: "auto", marginBottom: 4 }}>
              {books.map(b => (
                <button key={b} onClick={() => setLivro(b)} style={{ background: livro === b ? "#7C3AED" : "#fff", border: `2px solid ${livro === b ? "#7C3AED" : "#E9D5FF"}`, borderRadius: 10, padding: "9px 4px", fontSize: 11, fontWeight: 800, color: livro === b ? "#fff" : "#1a1a2e", cursor: "pointer", fontFamily: "'Nunito',sans-serif", lineHeight: 1.2 }}>{b}</button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => setStep(1)} disabled={!livro} style={sBtn(!livro)}>Próximo →</button>
        </div>
      </>}

      {step === 1 && <>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9D8EC0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Passo 2 de 4</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", marginBottom: 14 }}>Capítulo de {livro}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, maxHeight: 180, overflowY: "auto", marginBottom: 16 }}>
          {Array.from({ length: CAPS[livro] || 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setCap(n)} style={{ background: cap === n ? "#F59E0B" : "#fff", border: `2px solid ${cap === n ? "#F59E0B" : "#E9D5FF"}`, borderRadius: 9, padding: "9px 2px", fontSize: 12, fontWeight: 800, color: cap === n ? "#fff" : "#1a1a2e", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>{n}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setStep(0)} style={bBtn}>← Anterior</button>
          <button onClick={() => setStep(2)} disabled={!cap} style={sBtn(!cap)}>Próximo →</button>
        </div>
      </>}

      {step === 2 && <>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9D8EC0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Passo 3 de 4</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", marginBottom: 14 }}>Quais recursos incluir?</div>
        {recursos.map(r => {
          const on = rec.includes(r);
          return (
            <div key={r} onClick={() => setRec(prev => on ? prev.filter(x => x !== r) : [...prev, r])}
              style={{ display: "flex", alignItems: "center", gap: 12, background: on ? "#f0fdf4" : "#fff", border: `2px solid ${on ? "#10B981" : "#E9D5FF"}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${on ? "#10B981" : "#C4B5FD"}`, background: on ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: "#fff" }}>{on ? "✓" : ""}</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{r}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => setStep(1)} style={bBtn}>← Anterior</button>
          <button onClick={() => setStep(3)} style={sBtn(false)}>Próximo →</button>
        </div>
      </>}

      {step === 3 && <>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9D8EC0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Passo 4 de 4</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", marginBottom: 14 }}>Versão da Bíblia</div>
        {VERSOES.map(v => (
          <div key={v} onClick={() => setVer(v)} style={{ display: "flex", alignItems: "center", gap: 12, background: ver === v ? "#f0e6ff" : "#fff", border: `2px solid ${ver === v ? "#7C3AED" : "#E9D5FF"}`, borderRadius: 14, padding: "13px 16px", marginBottom: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>📖</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => setStep(2)} style={bBtn}>← Anterior</button>
          <button onClick={generate} style={sBtn(false)}>✨ Gerar Estudo!</button>
        </div>
      </>}
    </div>
  );
}

// ── DEVOCIONAL ────────────────────────────────────────────────────────
function DevScreen({ user, onBack }) {
  const [focos, setFocos] = useState([]);
  const [livro, setLivro] = useState("");
  const [cap, setCap] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const focosOpts = ["Crescimento espiritual", "Vida de oração", "Família", "Cura e restauração", "Santidade", "Espírito Santo"];

  async function generate() {
    setLoading(true);
    try {
      const foco = focos.length ? focos.join(", ") : "crescimento espiritual e vida com o Espírito Santo";
      const ref = livro ? `${livro} ${cap || 1}` : "um trecho escolhido por você, mentor";
      const txt = await callClaude(
        `Você é um mentor espiritual pentecostal super animado falando com ${user.name}, jovem de 10-15 anos.

SIGA EXATAMENTE ESTE MODELO (igual ao PDF de referência com emojis, seções numeradas, linguagem jovem):

# 1. Fala, ${user.name}! ✌️ 😎
[saudação super animada, use gírias cristãs, emojis, chame pelo nome]

# 2. O que tá rolando? 🤔 📖
[contexto do texto bíblico ${ref} de forma jovem e animada]

# 3. Conexão Espírito Santo 🔥 🌩️
[aplicação pentecostal profunda, fale do Espírito Santo, discernimento, dons]

Foco de hoje: ${foco}

# 4. Desafio Radical 🛹 ⚡
[2-3 desafios práticos numerados para a semana]

# 5. Versículo pra postar 📸 ✨
[versículo principal em > blockquote com referência completa "Livro cap:ver", depois hashtags cristãs pentecostais]

Use markdown, emojis, gírias cristãs, linguagem jovem. Referencie versículos como "Livro cap:ver".
Seja transformador, animado e cheio do Espírito Santo!`
      );
      setResult(txt);
    } catch { alert("Erro ao gerar. Tente novamente."); }
    setLoading(false);
  }

  if (result) return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <ResultViewer content={result} title="Devocional de Hoje" type="Devocional Diário" userName={user.name} isDevocional={true} onBack={() => setResult(null)} onHome={onBack} />
    </div>
  );
  if (loading) return <div style={{ flex: 1, background: "#f9f5ff" }}><Spinner msg="Preparando seu devocional... 🕊️" /></div>;

  const bBtn = { background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" };

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={bBtn}>← Voltar</button>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1a1a2e" }}>🕯️ Devocional Diário</div>
      </div>

      <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Qual é o foco de hoje?</div>
      <p style={{ fontSize: 13, color: "#9D8EC0", fontWeight: 700, marginBottom: 14 }}>Escolha um ou mais temas 🙌</p>

      {focosOpts.map(f => {
        const on = focos.includes(f);
        return (
          <div key={f} onClick={() => setFocos(prev => on ? prev.filter(x => x !== f) : [...prev, f])}
            style={{ display: "flex", alignItems: "center", gap: 12, background: on ? "#f0fdf4" : "#fff", border: `2px solid ${on ? "#10B981" : "#E9D5FF"}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${on ? "#10B981" : "#C4B5FD"}`, background: on ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff" }}>{on ? "✓" : ""}</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{f}</span>
          </div>
        );
      })}

      <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", margin: "20px 0 6px" }}>Livro da Bíblia (opcional)</div>
      <select value={livro} onChange={e => { setLivro(e.target.value); setCap(0); }} style={{ width: "100%", background: "#fff", border: "2px solid #E9D5FF", borderRadius: 14, padding: "12px 14px", fontSize: 14, color: "#1a1a2e", fontFamily: "'Nunito',sans-serif", marginBottom: 12, appearance: "none", fontWeight: 700, boxSizing: "border-box" }}>
        <option value="">O app escolhe pra você ✨</option>
        {[...AT, ...NT].map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      {livro && <>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED", marginBottom: 8 }}>Capítulo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, maxHeight: 140, overflowY: "auto", marginBottom: 16 }}>
          {Array.from({ length: CAPS[livro] || 10 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setCap(n)} style={{ background: cap === n ? "#F59E0B" : "#fff", border: `2px solid ${cap === n ? "#F59E0B" : "#E9D5FF"}`, borderRadius: 9, padding: "9px 2px", fontSize: 12, fontWeight: 800, color: cap === n ? "#fff" : "#1a1a2e", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>{n}</button>
          ))}
        </div>
      </>}

      <button onClick={generate} style={{ width: "100%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", marginTop: 8 }}>
        ✨ Gerar Devocional!
      </button>
    </div>
  );
}

// ── PLANO ─────────────────────────────────────────────────────────────
function PlanoScreen({ user, onBack }) {
  const [plano, setPlano] = useState("");
  const [ver, setVer] = useState("ARC");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const planos = ["Novo Testamento em 90 dias","Bíblia de capa a capa em 1 ano","Bíblia em 1 ano (plano misto)","Evangelhos em 15 dias","Provérbios em 31 dias","Salmos em 30 dias"];

  async function generate() {
    if (!plano) { alert("Selecione um plano"); return; }
    setLoading(true);
    try {
      const txt = await callClaude(`Você é mentor bíblico jovem pentecostal. Crie guia motivacional estilo jovem animado para o plano: "${plano}" na versão ${ver}. Use linguagem jovem com emojis, seções numeradas com títulos animados, dicas práticas, versículos encorajadores (formato Livro cap:ver), desafios da semana. Formato igual ao PDF com # seções numeradas. Seja animado e transformador!`);
      setResult(txt);
    } catch { alert("Erro ao gerar."); }
    setLoading(false);
  }

  if (result) return <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}><ResultViewer content={result} title={plano} type="Plano de Leitura" userName={user.name} isDevocional={false} onBack={() => setResult(null)} onHome={onBack} /></div>;
  if (loading) return <div style={{ flex: 1, background: "#f9f5ff" }}><Spinner msg="Montando seu plano... 📅" /></div>;

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Voltar</button>
        <div style={{ fontSize: 18, fontWeight: 900 }}>📅 Plano de Leitura</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a2e", marginBottom: 14 }}>Escolha seu plano</div>
      {planos.map(p => (
        <div key={p} onClick={() => setPlano(p)} style={{ background: plano === p ? "#f0e6ff" : "#fff", border: `2px solid ${plano === p ? "#7C3AED" : "#E9D5FF"}`, borderRadius: 14, padding: "13px 16px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{p}</span>
        </div>
      ))}
      <div style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED", margin: "16px 0 8px" }}>Versão da Bíblia</div>
      <select value={ver} onChange={e => setVer(e.target.value)} style={{ width: "100%", background: "#fff", border: "2px solid #E9D5FF", borderRadius: 14, padding: "12px 14px", fontSize: 14, color: "#1a1a2e", fontFamily: "'Nunito',sans-serif", marginBottom: 16, appearance: "none", fontWeight: 700, boxSizing: "border-box" }}>
        {VERSOES.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <button onClick={generate} style={{ width: "100%", background: "linear-gradient(135deg,#F59E0B,#F97316)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>✨ Montar Plano!</button>
    </div>
  );
}

// ── QUIZ ──────────────────────────────────────────────────────────────
function QuizScreen({ onBack }) {
  const [nivel, setNivel] = useState("Fácil");
  const [qtd, setQtd] = useState(10);
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [pts, setPts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [resp, setResp] = useState(false);
  const [chosen, setChosen] = useState(-1);
  const [done, setDone] = useState(false);

  async function startQuiz() {
    setLoading(true);
    try {
      let txt = await callClaude(`Crie exatamente ${qtd} perguntas de quiz bíblico nível ${nivel} para jovens de 10-15 anos. Responda APENAS JSON válido sem markdown: [{"pergunta":"texto","opcoes":["A","B","C","D"],"correta":0,"explicacao":"texto"}]`, 2000);
      txt = txt.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(txt);
      setQs(parsed); setIdx(0); setPts(0); setResp(false); setChosen(-1); setDone(false); setStarted(true);
    } catch { alert("Erro ao gerar quiz."); }
    setLoading(false);
  }

  function answer(i) {
    if (resp) return;
    setChosen(i); setResp(true);
    if (i === qs[idx].correta) setPts(p => p + 1);
  }

  const niveis = ["Fácil","Intermediário","Difícil","Especialista"];
  const icons = ["😊","🤔","💪","🎓"];

  if (loading) return <div style={{ flex: 1, background: "#f9f5ff" }}><Spinner msg="Preparando as perguntas... 🎯" /></div>;

  if (!started) return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Voltar</button>
        <div style={{ fontSize: 18, fontWeight: 900 }}>🎯 Quiz Bíblico</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 14 }}>Nível de dificuldade</div>
      {niveis.map((n, i) => (
        <div key={n} onClick={() => setNivel(n)} style={{ background: nivel === n ? "#f0e6ff" : "#fff", border: `2px solid ${nivel === n ? "#7C3AED" : "#E9D5FF"}`, borderRadius: 14, padding: "13px 16px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{icons[i]}</span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{n}</span>
        </div>
      ))}
      <div style={{ fontSize: 17, fontWeight: 900, margin: "16px 0 10px" }}>Quantidade de perguntas</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[5,10,20,30].map(q => (
          <div key={q} onClick={() => setQtd(q)} style={{ flex: 1, background: qtd === q ? "#7C3AED" : "#fff", border: `2px solid ${qtd === q ? "#7C3AED" : "#E9D5FF"}`, borderRadius: 14, padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: qtd === q ? "#fff" : "#1a1a2e" }}>{q}</span>
          </div>
        ))}
      </div>
      <button onClick={startQuiz} style={{ width: "100%", background: "linear-gradient(135deg,#10B981,#059669)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>▶ Iniciar Quiz!</button>
    </div>
  );

  if (done) {
    const pct = Math.round(pts / qs.length * 100);
    const em = pct >= 80 ? "🏆" : pct >= 60 ? "🎉" : pct >= 40 ? "💪" : "📖";
    return (
      <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>{em}</div>
          <div style={{ fontSize: 56, fontWeight: 900, background: "linear-gradient(135deg,#7C3AED,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pct}%</div>
          <div style={{ fontSize: 16, color: "#7C3AED", fontWeight: 800, marginTop: 6 }}>{pts} de {qs.length} acertos</div>
          <p style={{ marginTop: 14, color: "#9D8EC0", fontSize: 14, fontWeight: 700 }}>{pct >= 80 ? "Incrível! Você manja demais da Bíblia! 🔥" : pct >= 60 ? "Muito bom! Continue estudando! 💪" : "Continue lendo a Bíblia todos os dias! 📖"}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
            <button onClick={() => { setStarted(false); setDone(false); }} style={{ background: "#f0e6ff", border: "2px solid #7C3AED", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🔄 Novo Quiz</button>
            <button onClick={onBack} style={{ background: "#f5f5f5", border: "2px solid #ddd", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 800, color: "#666", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🏠 Início</button>
          </div>
        </div>
      </div>
    );
  }

  const q = qs[idx];
  const pct = Math.round(idx / qs.length * 100);

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Sair</button>
        <div style={{ flex: 1, height: 8, background: "#E9D5FF", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#A855F7)", borderRadius: 4, transition: "width .4s" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED" }}>{idx+1}/{qs.length}</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 20, padding: "20px 18px", boxShadow: "0 2px 12px rgba(0,0,0,.06)", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#9D8EC0", marginBottom: 10 }}>Pergunta {idx+1} • {pts} acertos</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.4 }}>{q.pergunta}</div>
      </div>
      {q.opcoes.map((o, i) => {
        let bg = "#fff", border = "#E9D5FF", color = "#1a1a2e";
        if (resp) {
          if (i === q.correta) { bg = "#f0fdf4"; border = "#10B981"; color = "#065F46"; }
          else if (i === chosen) { bg = "#FFF1F2"; border = "#EF4444"; color = "#BE123C"; }
        }
        return (
          <button key={i} onClick={() => answer(i)} style={{ width: "100%", background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, cursor: resp ? "default" : "pointer", fontSize: 14, fontWeight: 800, color, textAlign: "left", fontFamily: "'Nunito',sans-serif", display: "block" }}>
            {String.fromCharCode(65+i)}) {o}
          </button>
        );
      })}
      {resp && (
        <>
          <div style={{ background: "#FEFCE8", border: "2px solid #F59E0B", borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 14, color: "#78350F", fontWeight: 700, lineHeight: 1.5 }}>💡 {q.explicacao}</div>
          <button onClick={() => { if (idx+1 >= qs.length) setDone(true); else { setIdx(i=>i+1); setResp(false); setChosen(-1); }}} style={{ width: "100%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
            {idx+1 < qs.length ? "Próxima →" : "🏆 Ver resultado"}
          </button>
        </>
      )}
    </div>
  );
}

// ── ESBOÇO ────────────────────────────────────────────────────────────
function EsbScreen({ user, onBack }) {
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [evento, setEvento] = useState("Culto de jovens");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const eventos = ["Culto de jovens","Culto de celebração","Culto à doutrina","Célula / pequeno grupo","EBD / ensino","Conferência / congresso"];

  async function generate() {
    if (!tema.trim()) { alert("Digite o tema"); return; }
    setLoading(true);
    try {
      const txt = await callClaude(`Você é um pastor pentecostal experiente. Crie esboço COMPLETO de sermão para ${user.name}. Tema: ${tema}. Texto: ${texto||"a escolher"}. Ocasião: ${evento}. Use seções numeradas com # títulos animados, **negrito**, listas, versículos no formato "Livro cap:ver". Inclua introdução impactante, contexto bíblico, 3-4 pontos com subtópicos e exemplos, aplicação prática, oração e chamada à decisão. Linguagem clara e poderosa.`);
      setResult(txt);
    } catch { alert("Erro ao gerar."); }
    setLoading(false);
  }

  if (result) return <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}><ResultViewer content={result} title={tema} type="Esboço de Sermão" userName={user.name} isDevocional={false} onBack={() => setResult(null)} onHome={onBack} /></div>;
  if (loading) return <div style={{ flex: 1, background: "#f9f5ff" }}><Spinner msg="Criando seu esboço... ✍️" /></div>;

  const inp = { width: "100%", background: "#fff", border: "2px solid #E9D5FF", borderRadius: 14, padding: "12px 14px", fontSize: 14, color: "#1a1a2e", fontFamily: "'Nunito',sans-serif", marginBottom: 14, outline: "none", boxSizing: "border-box", fontWeight: 700 };

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Voltar</button>
        <div style={{ fontSize: 18, fontWeight: 900 }}>✍️ Esboço de Sermão</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Tema da mensagem</div>
      <input value={tema} onChange={e => setTema(e.target.value)} style={inp} placeholder="Ex: O poder do Espírito Santo" />
      <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Texto base (opcional)</div>
      <input value={texto} onChange={e => setTexto(e.target.value)} style={inp} placeholder="Ex: Atos 2:1-4" />
      <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Tipo de ocasião</div>
      <select value={evento} onChange={e => setEvento(e.target.value)} style={{ ...inp, appearance: "none", cursor: "pointer" }}>
        {eventos.map(ev => <option key={ev} value={ev}>{ev}</option>)}
      </select>
      <button onClick={generate} style={{ width: "100%", background: "linear-gradient(135deg,#EC4899,#A855F7)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>✨ Gerar Esboço!</button>
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────
function AdminScreen({ onBack }) {
  const [emails, setEmails] = useState([]);
  const [newEM, setNewEM] = useState("");

  useEffect(() => {
    window.storage?.get("sb_emails").then(r => {
      if (r?.value) setEmails(JSON.parse(r.value).filter(e => e !== ADMIN_EMAIL));
    }).catch(() => {});
  }, []);

  async function saveAll(list) {
    try { await window.storage.set("sb_emails", JSON.stringify([ADMIN_EMAIL, ...list])); } catch {}
  }

  async function add() {
    const v = newEM.trim().toLowerCase();
    if (!v || !v.includes("@")) { alert("E-mail inválido"); return; }
    if (emails.includes(v)) { alert("Já liberado"); return; }
    const next = [...emails, v];
    setEmails(next); setNewEM(""); await saveAll(next);
  }

  async function remove(e) {
    const next = emails.filter(x => x !== e);
    setEmails(next); await saveAll(next);
  }

  return (
    <div style={{ flex: 1, background: "#f9f5ff", overflowY: "auto", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <button onClick={onBack} style={{ background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "#7C3AED", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Voltar</button>
        <div style={{ fontSize: 18, fontWeight: 900 }}>⚙️ Painel Admin</div>
      </div>
      <p style={{ fontSize: 13, color: "#9D8EC0", fontWeight: 700, marginBottom: 18 }}>Libere e-mails para acessar o Studio Bíblico</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={newEM} onChange={e => setNewEM(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          style={{ flex: 1, background: "#fff", border: "2px solid #E9D5FF", borderRadius: 14, padding: "12px 14px", fontSize: 14, color: "#1a1a2e", fontFamily: "'Nunito',sans-serif", outline: "none", fontWeight: 700 }}
          placeholder="E-mail para liberar..." />
        <button onClick={add} style={{ background: "linear-gradient(135deg,#10B981,#059669)", border: "none", borderRadius: 14, padding: "0 18px", fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", whiteSpace: "nowrap" }}>+ Liberar</button>
      </div>

      {emails.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📬</div>
          <p style={{ color: "#9D8EC0", fontWeight: 800, fontSize: 14 }}>Nenhum e-mail liberado ainda</p>
          <p style={{ color: "#C4B5FD", fontWeight: 700, fontSize: 13 }}>Adicione acima 👆</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#9D8EC0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Acessos liberados ({emails.length})</div>
          {emails.map(e => (
            <div key={e} style={{ background: "#fff", border: "2px solid #E9D5FF", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8, boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{e}</div>
              <button onClick={() => remove(e)} style={{ background: "#FFF1F2", border: "none", borderRadius: 8, color: "#BE123C", fontSize: 16, cursor: "pointer", fontWeight: 900, padding: "4px 8px" }}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Lora:ital,wght@0,400;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f9f5ff" }}>
      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "3px solid #7C3AED", padding: "11px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 2px 12px rgba(124,58,237,.1)" }}>
        <div style={{ width: 42, height: 42, background: "linear-gradient(135deg,#7C3AED,#E879F9)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✝</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, background: "linear-gradient(90deg,#7C3AED,#A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Studio Bíblico</div>
          <div style={{ fontSize: 10, color: "#9D8EC0", fontWeight: 800, letterSpacing: 1 }}>DEUS PRESENTE</div>
        </div>
        {user && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ background: "#f0e6ff", border: "2px solid #C4B5FD", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 800, color: "#7C3AED" }}>👤 {user.name.split(" ")[0]}</span>
            {user.isAdmin && <button onClick={() => setScreen("adm")} style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", border: "none", borderRadius: 18, padding: "6px 13px", fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>⚙ Admin</button>}
            <button onClick={() => { setUser(null); setScreen("login"); }} style={{ background: "#f5f5f5", border: "2px solid #ddd", borderRadius: 18, padding: "6px 13px", fontSize: 12, fontWeight: 800, color: "#666", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>Sair</button>
          </div>
        )}
      </div>

      {/* SCREENS */}
      {screen === "login" && <LoginScreen onLogin={u => { setUser(u); setScreen("home"); }} />}
      {screen === "home" && <HomeScreen user={user} onGo={setScreen} />}
      {screen === "livro" && <LivroScreen user={user} onBack={() => setScreen("home")} />}
      {screen === "plano" && <PlanoScreen user={user} onBack={() => setScreen("home")} />}
      {screen === "quiz" && <QuizScreen onBack={() => setScreen("home")} />}
      {screen === "dev" && <DevScreen user={user} onBack={() => setScreen("home")} />}
      {screen === "esb" && <EsbScreen user={user} onBack={() => setScreen("home")} />}
      {screen === "adm" && <AdminScreen onBack={() => setScreen("home")} />}
    </div>
  );
}
