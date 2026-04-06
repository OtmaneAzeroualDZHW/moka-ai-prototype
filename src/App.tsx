import { useMemo, useState } from "react";

const USERS = [
  { id: "konrad", name: "Konrad D.", initials: "KD", color: "#2563eb", role: "admin" },
  { id: "sarah", name: "Sarah W.", initials: "SW", color: "#7c3aed", role: "support" },
  { id: "Otmane", name: "Otmane A.", initials: "OA", color: "#059669", role: "sales" },
  { id: "Mike", name: "Mike W.", initials: "MW", color: "#ea580c", role: "hr" },
];

const AGENTS = [
  { id: "sales", name: "Sales Agent", short: "SA", color: "#2563eb" },
  { id: "support", name: "Support Agent", short: "SU", color: "#7c3aed" },
  { id: "hr", name: "HR Agent", short: "HR", color: "#ea580c" },
  { id: "finance", name: "Finance Agent", short: "FI", color: "#059669" },
];

const COLS = [
  { id: "neu", label: "Inbox", dot: "#3b82f6" },
  { id: "review", label: "Review", dot: "#8b5cf6" },
  { id: "zugewiesen", label: "Zugewiesen", dot: "#f59e0b" },
  { id: "inarbeit", label: "In Arbeit", dot: "#10b981" },
  { id: "erledigt", label: "Erledigt", dot: "#cbd5e1" },
];

const RAW_EMAILS = [
  {
    id: 101,
    fromName: "Muster GmbH",
    fromEmail: "anfrage@muster-gmbh.de",
    subject: "Bitte senden Sie uns ein Angebot für den Umbau",
    preview: "Wir benötigen zeitnah ein Angebot für unser neues Büro in Köln.",
    body: "Guten Tag, wir benötigen zeitnah ein Angebot für den Umbau unseres neuen Büros in Köln. Bitte melden Sie sich noch diese Woche. Freundliche Grüße, Lara Schenk, Muster GmbH",
    receivedAt: "vor 2 Min.",
    source: "E-Mail",
    attachments: ["Grundriss.pdf"],
  },
  {
    id: 102,
    fromName: "Jana Becker",
    fromEmail: "jana.becker@mail.de",
    subject: "Bewerbung als Office Managerin",
    preview: "Im Anhang finden Sie meine Bewerbung und meinen Lebenslauf.",
    body: "Hallo, im Anhang finden Sie meine Bewerbung als Office Managerin sowie meinen Lebenslauf. Ich freue mich auf Ihre Rückmeldung. Viele Grüße, Jana Becker",
    receivedAt: "vor 7 Min.",
    source: "E-Mail",
    attachments: ["Bewerbung.pdf", "CV.pdf"],
  },
  {
    id: 103,
    fromName: "Telekom Deutschland",
    fromEmail: "billing@telekom.de",
    subject: "Ihre Monatsrechnung März 2026",
    preview: "Anbei erhalten Sie Ihre aktuelle Rechnung.",
    body: "Sehr geehrte Damen und Herren, anbei erhalten Sie Ihre Monatsrechnung für März 2026. Zahlungsziel ist der 28.03.2026.",
    receivedAt: "vor 14 Min.",
    source: "E-Mail",
    attachments: ["Rechnung-03-2026.pdf"],
  },
  {
    id: 104,
    fromName: "Bestandskunde Nordbau",
    fromEmail: "projekt@nordbau.de",
    subject: "Dringende Reklamation zur letzten Lieferung",
    preview: "Bei der letzten Lieferung fehlen zwei Positionen.",
    body: "Hallo Team, bei der letzten Lieferung fehlen zwei Positionen. Bitte dringend prüfen und heute Rückmeldung geben, da unsere Baustelle sonst steht.",
    receivedAt: "vor 26 Min.",
    source: "E-Mail",
    attachments: [],
  },
  {
    id: 105,
    fromName: "Stefan Braun",
    fromEmail: "stefan.braun@firma.de",
    subject: "Krankmeldung für diese Woche",
    preview: "Ich bin leider bis Freitag krankgeschrieben.",
    body: "Hallo, ich bin leider bis Freitag krankgeschrieben. Die AU liegt als PDF im Anhang. Grüße, Stefan Braun",
    receivedAt: "vor 39 Min.",
    source: "E-Mail",
    attachments: ["AU-Stefan-Braun.pdf"],
  },
];

const NOTIFS = [
  { id: 1, text: "Neue Angebotsanfrage erkannt und priorisiert", time: "vor 2 Min.", read: false },
  { id: 2, text: "Bewerbung automatisch dem HR-Agent zugeordnet", time: "vor 7 Min.", read: false },
  { id: 3, text: "Monatsrechnung im Finance-Board angelegt", time: "vor 14 Min.", read: true },
  { id: 4, text: "Dringende Reklamation auf hohe Priorität gesetzt", time: "vor 26 Min.", read: true },
];

function classifyEmail(email) {
  const text = `${email.subject} ${email.body}`.toLowerCase();

  if (text.includes("angebot") || text.includes("anfrage")) {
    return {
      agent: "sales",
      confidence: 97,
      title: "Angebot erstellen und Kundenkontakt aufnehmen",
      summary: "Neue Sales-Anfrage mit zeitkritischem Angebotswunsch.",
      priority: "hoch",
      fields: {
        Kanal: email.source,
        Kunde: email.fromName,
        Aufgabe: "Angebot erstellen",
        Frist: "Diese Woche",
      },
      steps: ["Anfrage prüfen", "Angebot vorbereiten", "Rückmeldung senden"],
    };
  }

  if (text.includes("bewerbung") || text.includes("lebenslauf")) {
    return {
      agent: "hr",
      confidence: 94,
      title: "Bewerbung sichten und Erstprüfung durchführen",
      summary: "Bewerbung mit Unterlagen eingegangen und für HR vorsortiert.",
      priority: "mittel",
      fields: {
        Kanal: email.source,
        Bewerber: email.fromName,
        Position: "Office Managerin",
        Anlagen: `${email.attachments.length} Dateien`,
      },
      steps: ["Unterlagen sichten", "Profil bewerten", "Rückmeldung planen"],
    };
  }

  if (text.includes("rechnung") || text.includes("zahlungsziel")) {
    return {
      agent: "finance",
      confidence: 99,
      title: "Rechnung prüfen und zur Freigabe vorbereiten",
      summary: "Rechnung erkannt, relevante Informationen extrahiert und eingeordnet.",
      priority: "mittel",
      fields: {
        Kanal: email.source,
        Lieferant: email.fromName,
        Dokument: email.attachments[0] || "E-Mail",
        Zahlungsziel: "28.03.2026",
      },
      steps: ["Daten prüfen", "Freigabe einholen", "Buchung vorbereiten"],
    };
  }

  if (text.includes("krank") || text.includes("au ")) {
    return {
      agent: "hr",
      confidence: 92,
      title: "Krankmeldung prüfen und intern weitergeben",
      summary: "Krankmeldung erkannt, HR-Workflow vorgeschlagen.",
      priority: "mittel",
      fields: {
        Kanal: email.source,
        Mitarbeiter: email.fromName,
        Typ: "Krankmeldung",
        AU: email.attachments.length ? "Vorhanden" : "Fehlt",
      },
      steps: ["AU prüfen", "Kalender aktualisieren", "Team informieren"],
    };
  }

  return {
    agent: "support",
    confidence: 95,
    title: "Kundenanliegen prüfen und priorisieren",
    summary: "Support-Fall erkannt und als dringlich eingestuft.",
    priority: "hoch",
    fields: {
      Kanal: email.source,
      Kunde: email.fromName,
      Typ: "Reklamation",
      SLA: "Heute",
    },
    steps: ["Anliegen prüfen", "Verantwortliche informieren", "Antwort vorbereiten"],
  };
}

function buildTasksFromEmails(emails) {
  return emails.map((email) => {
    const analysis = classifyEmail(email);
    return {
      id: email.id,
      emailId: email.id,
      email,
      status: "neu",
      assignee: null,
      comments: [],
      source: "auto",
      ...analysis,
    };
  });
}

const usr = (id) => USERS.find((x) => x.id === id);
const agt = (id) => AGENTS.find((x) => x.id === id);

function priorityChip(priority) {
  if (priority === "hoch") return { bg: "#fee2e2", color: "#b91c1c", label: "Hoch" };
  if (priority === "mittel") return { bg: "#fef3c7", color: "#b45309", label: "Mittel" };
  return { bg: "#e2e8f0", color: "#475569", label: "Niedrig" };
}

function MokaLogo({ dark = false, size = 42 }) {
  const navy = dark ? "#ffffff" : "#082b63";
  const amber = "#c88a2d";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M22 10h20l-3 5v15l4 6v13H21V36l4-6V15l-3-5Z" fill={amber} opacity="0.96" />
        <path d="M22 10h20l-3 5v15l4 6v13H21V36l4-6V15l-3-5Z" stroke={navy} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M25 15h14" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M26 30h12" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M21 36h22" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M43 20c4 1 7 4 7 8 0 3-2 6-5 7" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div>
        <div style={{ fontSize: dark ? 22 : 18, fontWeight: 800, lineHeight: 1, color: dark ? "#fff" : "#082b63", letterSpacing: "-.03em" }}>
          MOKA AI
        </div>
        <div style={{ fontSize: 12, color: amber, fontWeight: 700, marginTop: 4 }}>From Inbox to Action</div>
      </div>
    </div>
  );
}

function WindowFrame({ title, children, onClose, width = 620, maxHeight = "86vh" }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.34)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, padding: 20 }}>
      <div className="glass" style={{ width, maxWidth: "96vw", maxHeight, borderRadius: 24, overflow: "hidden", animation: "enter .16s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,.72)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#fb7185", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#fbbf24", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#34d399", display: "inline-block" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 12, background: "#f8fafc", color: "#64748b", fontSize: 18 }}>×</button>
        </div>
        <div style={{ overflow: "auto", maxHeight: "calc(86vh - 64px)" }}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [emails, setEmails] = useState(RAW_EMAILS);
  const [tasks, setTasks] = useState(buildTasksFromEmails(RAW_EMAILS));
  const [sel, setSel] = useState(buildTasksFromEmails(RAW_EMAILS)[0] || null);
  const [comment, setComment] = useState("");
  const [me] = useState("konrad");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [roleView, setRoleView] = useState("alle");
  const [form, setForm] = useState({ fromName: "", fromEmail: "", subject: "", body: "", attachments: "" });
  const [activeWindow, setActiveWindow] = useState("board");

  const claim = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, assignee: me, status: "review" } : t)));
    setSel((s) => (s?.id === id ? { ...s, assignee: me, status: "review" } : s));
  };

  const advance = (id) => {
    const order = ["neu", "review", "zugewiesen", "inarbeit", "erledigt"];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = order[Math.min(order.indexOf(t.status) + 1, order.length - 1)];
        return { ...t, status: next };
      })
    );
    setSel((s) => {
      if (s?.id !== id) return s;
      const next = order[Math.min(order.indexOf(s.status) + 1, order.length - 1)];
      return { ...s, status: next };
    });
  };

  const assign = (tid, uid) => {
    setTasks((prev) => prev.map((t) => (t.id === tid ? { ...t, assignee: uid, status: t.status === "neu" ? "zugewiesen" : t.status } : t)));
    setSel((s) => (s?.id === tid ? { ...s, assignee: uid, status: s.status === "neu" ? "zugewiesen" : s.status } : s));
  };

  const addComment = (id) => {
    if (!comment.trim()) return;
    const c = { user: me, text: comment.trim(), time: "gerade eben" };
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, comments: [...t.comments, c] } : t)));
    setSel((s) => (s?.id === id ? { ...s, comments: [...s.comments, c] } : s));
    setComment("");
  };

  const createEmailTask = () => {
    if (!form.fromName || !form.fromEmail || !form.subject || !form.body) return;
    const newEmail = {
      id: Date.now(),
      fromName: form.fromName,
      fromEmail: form.fromEmail,
      subject: form.subject,
      preview: form.body.slice(0, 80) + (form.body.length > 80 ? "..." : ""),
      body: form.body,
      receivedAt: "gerade eben",
      source: "E-Mail",
      attachments: form.attachments ? form.attachments.split(",").map((x) => x.trim()).filter(Boolean) : [],
    };
    const analysis = classifyEmail(newEmail);
    const task = {
      id: newEmail.id,
      emailId: newEmail.id,
      email: newEmail,
      status: "neu",
      assignee: null,
      comments: [],
      source: "auto",
      ...analysis,
    };
    setEmails((prev) => [newEmail, ...prev]);
    setTasks((prev) => [task, ...prev]);
    setSel(task);
    setShowCreate(false);
    setActiveWindow("detail");
    setForm({ fromName: "", fromEmail: "", subject: "", body: "", attachments: "" });
  };

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (roleView === "alle") return true;
      if (roleView === "sales") return t.agent === "sales";
      if (roleView === "support") return t.agent === "support";
      if (roleView === "finance") return t.agent === "finance";
      if (roleView === "hr") return t.agent === "hr";
      return true;
    });
  }, [tasks, roleView]);

  const unread = NOTIFS.filter((n) => !n.read).length;
  const kpis = {
    emails: emails.length,
    tasks: tasks.length,
    high: tasks.filter((t) => t.priority === "hoch").length,
    done: tasks.filter((t) => t.status === "erledigt").length,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}
        .glass{background:rgba(255,255,255,.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.55);box-shadow:0 10px 30px rgba(15,23,42,.07)}
        .card{transition:all .18s ease;cursor:pointer}
        .card:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(15,23,42,.08)}
        button{border:none;cursor:pointer;font-family:inherit}
        input,textarea{font-family:inherit}
        @keyframes enter{from{opacity:0;transform:translateY(6px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: 20 }}>
        <div className="glass" style={{ borderRadius: 28, padding: 24, marginBottom: 18, overflow: "hidden", background: "linear-gradient(135deg,#041736 0%,#082b63 58%,#0f172a 100%)", color: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr .9fr", gap: 20 }}>
            <div>
              <MokaLogo dark size={54} />
              <h1 style={{ fontSize: 42, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-.03em", maxWidth: 720, marginTop: 18 }}>
                Ein Tool für alle Eingangskanäle – eine zentrale Arbeitsstruktur.
              </h1>
              <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,.78)", maxWidth: 720 }}>
                E-Mail zuerst: Nachrichten werden automatisch analysiert und direkt in Tasks und Workflows überführt.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
                <button onClick={() => setShowCreate(true)} style={{ padding: "12px 16px", borderRadius: 12, background: "#fff", color: "#082b63", fontWeight: 700, fontSize: 14 }}>
                  + Test-E-Mail anlegen
                </button>
                <button onClick={() => setActiveWindow("inbox")} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.10)", color: "#fff", border: "1px solid rgba(255,255,255,.15)", fontWeight: 600, fontSize: 14 }}>
                  Inbox öffnen
                </button>
                <button onClick={() => setActiveWindow("board")} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(200,138,45,.18)", color: "#ffd89c", border: "1px solid rgba(200,138,45,.28)", fontWeight: 700, fontSize: 14 }}>
                  Board öffnen
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["E-Mails", kpis.emails],
                ["Tasks", kpis.tasks],
                ["Hoch priorisiert", kpis.high],
                ["Erledigt", kpis.done],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 18 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>{label}</div>
                  <div style={{ fontSize: 34, fontWeight: 800, marginTop: 10 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, minHeight: "62vh" }}>
          <div className="glass" style={{ borderRadius: 24, padding: 16 }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: ".08em", marginBottom: 12 }}>ARBEITSFENSTER</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["inbox", "E-Mail Inbox", "Alle Eingänge"],
                  ["board", "Task Board", "Automatisch erzeugte Tasks"],
                  ["detail", "Task Detail", sel ? sel.title : "Bitte Task wählen"],
                ].map(([id, label, sub]) => (
                  <button
                    key={id}
                    onClick={() => id === "detail" ? sel && setActiveWindow("detail") : setActiveWindow(id)}
                    style={{
                      textAlign: "left",
                      padding: "14px 14px",
                      borderRadius: 18,
                      background: activeWindow === id ? "#082b63" : "#fff",
                      color: activeWindow === id ? "#fff" : "#0f172a",
                      border: activeWindow === id ? "1px solid #082b63" : "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{label}</div>
                    <div style={{ fontSize: 12, opacity: .72, marginTop: 5 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: ".08em", marginBottom: 12 }}>FILTER</div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { id: "alle", label: "Alle" },
                  { id: "sales", label: "Sales" },
                  { id: "support", label: "Support" },
                  { id: "hr", label: "HR" },
                  { id: "finance", label: "Finance" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRoleView(r.id)}
                    style={{
                      padding: "11px 12px",
                      borderRadius: 14,
                      background: roleView === r.id ? "#c88a2d" : "#fff",
                      color: roleView === r.id ? "#fff" : "#475569",
                      fontWeight: 800,
                      fontSize: 13,
                      border: roleView === r.id ? "1px solid #c88a2d" : "1px solid #e2e8f0",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: ".08em" }}>NOTIFS</div>
              <button onClick={() => setShowNotifs(!showNotifs)} style={{ width: 38, height: 38, borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", position: "relative" }}>
                🔔
                {unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 999, background: "#2563eb", color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center" }}>{unread}</span>}
              </button>
            </div>

            {showNotifs && (
              <div style={{ display: "grid", gap: 8 }}>
                {NOTIFS.map((n) => (
                  <div key={n.id} style={{ padding: 12, borderRadius: 16, background: n.read ? "#fff" : "#eff6ff", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, lineHeight: 1.45, color: "#334155", fontWeight: n.read ? 500 : 700 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{n.time}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex" }}>
                {USERS.map((x, i) => (
                  <div key={x.id} title={x.name} style={{ width: 34, height: 34, borderRadius: 999, background: x.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, marginLeft: i > 0 ? -8 : 0, border: "2px solid #fff" }}>
                    {x.initials}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass" style={{ borderRadius: 24, padding: 18 }}>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
              <button onClick={() => setActiveWindow("inbox")} className="card" style={{ padding: 18, borderRadius: 22, background: "#fff", border: "1px solid #e2e8f0", textAlign: "left" }}>
                <div style={{ fontSize: 34 }}>📨</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 14 }}>Inbox-Fenster</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55, marginTop: 8 }}>Öffnet die E-Mail-Ansicht als eigenes Fenster mit allen Eingängen und Anhängen.</div>
              </button>
              <button onClick={() => setActiveWindow("board")} className="card" style={{ padding: 18, borderRadius: 22, background: "#fff", border: "1px solid #e2e8f0", textAlign: "left" }}>
                <div style={{ fontSize: 34 }}>🧠</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 14 }}>Board-Fenster</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55, marginTop: 8 }}>Zeigt den kompletten Lifecycle von Inbox bis Erledigt in einem separaten Arbeitsfenster.</div>
              </button>
              <button onClick={() => setShowCreate(true)} className="card" style={{ padding: 18, borderRadius: 22, background: "linear-gradient(135deg,#082b63 0%,#0f172a 100%)", color: "#fff", border: "1px solid #082b63", textAlign: "left" }}>
                <div style={{ fontSize: 34 }}>✦</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 14 }}>Neue Test-E-Mail</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.55, marginTop: 8 }}>Erstellt direkt eine neue Mail und öffnet danach das Detail-Fenster mit Analyse und Task.</div>
              </button>
            </div>

            <div style={{ marginTop: 18, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Schnellübersicht</div>
              <div style={{ display: "grid", gap: 10 }}>
                {visible.slice(0, 4).map((task) => {
                  const agent = agt(task.agent);
                  const pr = priorityChip(task.priority);
                  return (
                    <button key={task.id} onClick={() => { setSel(task); setActiveWindow("detail"); }} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: 14, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0", textAlign: "left" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ padding: "4px 8px", borderRadius: 999, background: `${agent.color}12`, color: agent.color, fontSize: 10, fontWeight: 800 }}>{agent.short}</span>
                          <span style={{ padding: "4px 8px", borderRadius: 999, background: pr.bg, color: pr.color, fontSize: 10, fontWeight: 800 }}>{pr.label}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{task.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{task.email.fromName}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Öffnen →</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <WindowFrame title="Neue Test-E-Mail" onClose={() => setShowCreate(false)} width={640}>
          <div style={{ padding: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="Absendername" style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" }} />
              <input value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="E-Mail-Adresse" style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" }} />
            </div>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Betreff" style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", marginBottom: 12 }} />
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="E-Mail-Inhalt" rows={7} style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", resize: "vertical", marginBottom: 12 }} />
            <input value={form.attachments} onChange={(e) => setForm({ ...form, attachments: e.target.value })} placeholder="Anhänge, getrennt mit Komma" style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", marginBottom: 18 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={createEmailTask} style={{ flex: 1, padding: "14px 16px", borderRadius: 14, background: "#082b63", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                Speichern und automatisch analysieren
              </button>
              <button onClick={() => setShowCreate(false)} style={{ padding: "14px 18px", borderRadius: 14, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontWeight: 700 }}>
                Abbrechen
              </button>
            </div>
          </div>
        </WindowFrame>
      )}

      {activeWindow === "inbox" && (
        <WindowFrame title="E-Mail Inbox" onClose={() => setActiveWindow("")} width={980}>
          <div style={{ padding: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              {emails.map((email) => {
                const task = tasks.find((t) => t.emailId === email.id);
                const agent = task ? agt(task.agent) : null;
                return (
                  <button key={email.id} onClick={() => { if (task) { setSel(task); setActiveWindow("detail"); } }} className="card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{email.fromName}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{email.fromEmail}</div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>{email.subject}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 1.55 }}>{email.preview}</div>
                        {email.attachments.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                            {email.attachments.map((a) => (
                              <span key={a} style={{ padding: "6px 10px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 11, color: "#475569", fontWeight: 700 }}>
                                📎 {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{email.receivedAt}</div>
                        {agent && (
                          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: `${agent.color}12`, color: agent.color, fontSize: 11, fontWeight: 800 }}>
                            {agent.short} · {task.confidence}%
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </WindowFrame>
      )}

      {activeWindow === "board" && (
        <WindowFrame title="AI Task Board" onClose={() => setActiveWindow("")} width={1220}>
          <div style={{ padding: 18, display: "flex", gap: 10, alignItems: "flex-start", overflowX: "auto" }}>
            {COLS.map((col) => {
              const ct = visible.filter((t) => t.status === col.id);
              return (
                <div key={col.id} style={{ minWidth: 230, width: 230 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 10px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: col.dot }} />
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{col.label}</div>
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{ct.length}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {ct.map((task) => {
                      const agent = agt(task.agent);
                      const asgn = task.assignee ? usr(task.assignee) : null;
                      const pr = priorityChip(task.priority);
                      return (
                        <button key={task.id} onClick={() => { setSel(task); setActiveWindow("detail"); }} className="card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, textAlign: "left" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ padding: "4px 8px", borderRadius: 999, background: `${agent.color}12`, color: agent.color, fontSize: 10, fontWeight: 800 }}>{agent.short}</div>
                            <div style={{ marginLeft: "auto", padding: "4px 8px", borderRadius: 999, background: pr.bg, color: pr.color, fontSize: 10, fontWeight: 800 }}>{pr.label}</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>{task.title}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, lineHeight: 1.45 }}>{task.summary}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{task.email.fromName}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {asgn ? (
                                <div title={asgn.name} style={{ width: 24, height: 24, borderRadius: 999, background: asgn.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>
                                  {asgn.initials}
                                </div>
                              ) : (
                                <div style={{ width: 24, height: 24, borderRadius: 999, border: "1.5px dashed #cbd5e1" }} />
                              )}
                              <div style={{ fontSize: 11, color: task.confidence > 95 ? "#059669" : "#b45309", fontWeight: 800 }}>{task.confidence}%</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </WindowFrame>
      )}

      {activeWindow === "detail" && sel && (() => {
        const agent = agt(sel.agent);
        const colInfo = COLS.find((c) => c.id === sel.status);
        const pr = priorityChip(sel.priority);
        return (
          <WindowFrame title="Task Detail" onClose={() => setActiveWindow("")} width={880}>
            <div style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ padding: "5px 10px", borderRadius: 999, background: `${agent.color}12`, color: agent.color, fontSize: 11, fontWeight: 800 }}>{agent.name}</div>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: colInfo.dot }} />
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{colInfo.label}</div>
                    <div style={{ padding: "5px 10px", borderRadius: 999, background: pr.bg, color: pr.color, fontSize: 11, fontWeight: 800 }}>{pr.label}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>{sel.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginTop: 10 }}>{sel.summary}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, letterSpacing: ".08em", marginBottom: 8 }}>ORIGINAL E-MAIL</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Von: {sel.email.fromName} · {sel.email.fromEmail}</div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{sel.email.subject}</div>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, marginTop: 10 }}>{sel.email.body}</div>
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
                    <div style={{ padding: "14px 14px 10px", fontSize: 11, color: "#94a3b8", fontWeight: 800, letterSpacing: ".08em" }}>KI ERKANNTE DATEN</div>
                    {Object.entries(sel.fields).map(([k, v], i, arr) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderTop: i === 0 ? "1px solid #eef2f7" : "1px solid #eef2f7" }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{k}</div>
                        <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 800, textAlign: "right" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, letterSpacing: ".08em", marginBottom: 8 }}>ZUWEISUNG</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {USERS.map((x) => (
                        <button key={x.id} onClick={() => assign(sel.id, x.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 14, background: sel.assignee === x.id ? `${x.color}12` : "#fff", border: sel.assignee === x.id ? `1.5px solid ${x.color}` : "1px solid #e2e8f0", color: sel.assignee === x.id ? x.color : "#475569", fontWeight: 700, fontSize: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 999, background: x.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>{x.initials}</div>
                          {x.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, letterSpacing: ".08em", marginBottom: 8 }}>PROZESS</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {sel.steps.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ padding: "8px 10px", borderRadius: 12, background: "#fff8ec", border: "1px solid #f3dfba", fontSize: 12, fontWeight: 700, color: "#8a5b17" }}>{s}</span>
                          {i < sel.steps.length - 1 && <span style={{ color: "#cbd5e1" }}>›</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, letterSpacing: ".08em", marginBottom: 8 }}>KOMMENTARE</div>
                    {sel.comments.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>Noch keine Kommentare.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
                        {sel.comments.map((c, i) => {
                          const cu = usr(c.user);
                          return (
                            <div key={i} style={{ paddingBottom: 10, borderBottom: i < sel.comments.length - 1 ? "1px solid #eef2f7" : "none" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 999, background: cu.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>{cu.initials}</div>
                                <div style={{ fontSize: 12, fontWeight: 800 }}>{cu.name}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.time}</div>
                              </div>
                              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, paddingLeft: 32 }}>{c.text}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment(sel.id)} placeholder="Kommentar hinzufügen..." style={{ flex: 1, padding: "12px 14px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff" }} />
                      <button onClick={() => addComment(sel.id)} style={{ padding: "12px 14px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>Senden</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {sel.status === "neu" && <button onClick={() => claim(sel.id)} style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "#082b63", color: "#fff", fontWeight: 800 }}>In Review übernehmen</button>}
                {sel.status === "review" && <button onClick={() => advance(sel.id)} style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "#082b63", color: "#fff", fontWeight: 800 }}>Zuweisen / Freigeben</button>}
                {sel.status === "zugewiesen" && <button onClick={() => advance(sel.id)} style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "#082b63", color: "#fff", fontWeight: 800 }}>In Arbeit setzen</button>}
                {sel.status === "inarbeit" && <button onClick={() => advance(sel.id)} style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "#059669", color: "#fff", fontWeight: 800 }}>Als erledigt markieren</button>}
                {sel.status === "erledigt" && <button style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "#ecfdf5", color: "#047857", fontWeight: 800 }}>Erledigt</button>}
              </div>
            </div>
          </WindowFrame>
        );
      })()}
    </div>
  );
}

