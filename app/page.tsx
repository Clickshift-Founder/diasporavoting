"use client";
import { useState, useEffect, useRef } from "react";
import Image from 'next/image';

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface AnimatedNumberProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

interface FormData {
  name: string;
  email: string;
  country: string;
  message: string;
  organization: string;
}

interface PetitionModalProps {
  onClose: () => void;
  onSigned: () => void;
  sigCount: number;
}

// ─── GOOGLE FONTS ───────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --forest: #003d1a;
      --forest-mid: #005a26;
      --forest-light: #007a35;
      --gold: #c9a84c;
      --gold-light: #e8c96a;
      --gold-pale: #f5edd6;
      --ivory: #faf8f2;
      --cream: #f2ede0;
      --dark: #0d1a0f;
      --charcoal: #2a2a2a;
      --muted: #6b7c6e;
      --red-accent: #c0392b;
      --white: #ffffff;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Source Serif 4', Georgia, serif;
      background: var(--ivory);
      color: var(--dark);
      overflow-x: hidden;
    }

    /* ─── SCROLLBAR ─── */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--forest); }
    ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }

    /* ─── ANIMATIONS ─── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideLeft {
      from { opacity: 0; transform: translateX(60px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.5); }
      50%       { box-shadow: 0 0 0 18px rgba(201, 168, 76, 0); }
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.92) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes overlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    @keyframes floatBob {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-12px); }
    }
    @keyframes borderPulse {
      0%, 100% { border-color: var(--gold); }
      50%       { border-color: var(--gold-light); }
    }
  `}</style>
);

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedNumber({ target, duration = 2000, prefix = "", suffix = "" }: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCurrent(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{current.toLocaleString()}{suffix}
    </span>
  );
}

// ─── PETITION MODAL ──────────────────────────────────────────────────────────
function PetitionModal({ onClose, onSigned, sigCount }: PetitionModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ name: "", email: "", country: "", organization: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const countries = [
    "Nigeria","United Kingdom","United States","Canada","Germany","Ireland",
    "UAE","Saudi Arabia","Qatar","Italy","South Africa","France","Netherlands",
    "Australia","Sweden","Norway","Spain","Belgium","Switzerland","Other"
  ];

  // ✅ STEP 1 — validate
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.country) e.country = "Please select your country";
    return e;
  };

  // ✅ STEP 2 — handleSubmit (calls the API)
  const handleSubmit = async () => {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setLoading(true);

  // Fire API call but don't block the user on it
  try {
    const res = await fetch("/api/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      console.error("Airtable error:", data);
      // Don't return — still advance to step 2
    }
  } catch (err) {
    console.error("Network error:", err);
    // Don't return — still advance to step 2
  }

  setLoading(false);
  setStep(2);
  onSigned();
};

  // ✅ STEP 3 — inputStyle helper
  const inputStyle = (field: string) => ({
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: `1.5px solid ${errors[field] ? "#e74c3c" : "rgba(201,168,76,0.3)"}`,
    borderRadius: "8px",
    color: "white",
    fontSize: "15px",
    fontFamily: "'Source Serif 4', serif",
    outline: "none",
    transition: "border-color 0.2s",
  });

 
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      animation: "overlayIn 0.3s ease",
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,20,8,0.88)",
        backdropFilter: "blur(8px)",
      }} />

      {/* Modal Box */}
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(145deg, #003d1a, #001a0c)",
        border: "1px solid rgba(201,168,76,0.4)",
        borderRadius: "20px",
        width: "100%", maxWidth: "600px",
        maxHeight: "90vh",
        overflowY: "auto",
        animation: "modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(201,168,76,0.2)",
      }}>
        {/* Gold top bar */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))", borderRadius: "20px 20px 0 0" }} />

        {step === 1 ? (
          <div style={{ padding: "40px" }}>
            {/* Header */}
            <button onClick={onClose} style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "white", width: "36px", height: "36px", borderRadius: "50%",
              cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                background: "var(--gold)", color: "var(--forest)", padding: "6px 14px",
                borderRadius: "20px", fontSize: "11px", fontFamily: "'DM Mono', monospace",
                fontWeight: "500", letterSpacing: "1px",
              }}>SIGN THE PETITION</div>
              <div style={{ color: "rgba(201,168,76,0.7)", fontSize: "13px", fontFamily: "'DM Mono', monospace" }}>
                {sigCount.toLocaleString()} signatures so far
              </div>
            </div>

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(22px, 4vw, 28px)",
              color: "white", lineHeight: "1.3",
              marginBottom: "16px",
            }}>
              Add Your Voice to the<br/>
              <em style={{ color: "var(--gold)" }}>Demand for Diaspora Voting</em>
            </h2>

            {/* Why it matters */}
            <div style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px", padding: "20px",
              marginBottom: "28px",
            }}>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                <strong style={{ color: "var(--gold)" }}>Your signature matters.</strong> Every name on this petition becomes 
                documented evidence presented directly to the National Assembly. When legislators 
                see thousands of Nigerians — from Lagos to London, Abuja to Atlanta — unified 
                in this demand, they cannot ignore it. This is not a form. <strong style={{ color: "white" }}>This is your 
                constitutional claim.</strong>
              </p>
            </div>

            {/* What signing does */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
              {[
                { icon: "📜", text: "Becomes part of the official legislative advocacy record" },
                { icon: "📢", text: "Amplifies Nigeria's democratic reform movement globally" },
                { icon: "🏛️", text: "Delivered to the House of Representatives and Senate" },
                { icon: "🔓", text: "Unlocks the full Policy Report for your download" },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: "10px",
                  padding: "14px", display: "flex", alignItems: "flex-start", gap: "10px",
                }}>
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "12.5px", lineHeight: "1.5" }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>FULL NAME *</label>
                <input
                  placeholder="e.g. Adaeze Okonkwo"
                  value={form.name}
                  onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name: null}); }}
                  style={inputStyle("name")}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = errors.name ? "#e74c3c" : "rgba(201,168,76,0.3)"}
                />
                {errors.name && <span style={{ color: "#e74c3c", fontSize: "12px" }}>{errors.name}</span>}
              </div>

              <div>
                <label style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>EMAIL ADDRESS *</label>
                <input
                  placeholder="your@email.com"
                  type="email"
                  value={form.email}
                  onChange={e => { setForm({...form, email: e.target.value}); setErrors({...errors, email: null}); }}
                  style={inputStyle("email")}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = errors.email ? "#e74c3c" : "rgba(201,168,76,0.3)"}
                />
                {errors.email && <span style={{ color: "#e74c3c", fontSize: "12px" }}>{errors.email}</span>}
              </div>

              <div>
                <label style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>COUNTRY OF RESIDENCE *</label>
                <select
                  value={form.country}
                  onChange={e => { setForm({...form, country: e.target.value}); setErrors({...errors, country: null}); }}
                  style={{ ...inputStyle("country"), cursor: "pointer" }}
                >
                  <option value="" style={{ background: "#003d1a" }}>Select your country...</option>
                  {countries.map(c => <option key={c} value={c} style={{ background: "#003d1a" }}>{c}</option>)}
                </select>
                {errors.country && <span style={{ color: "#e74c3c", fontSize: "12px" }}>{errors.country}</span>}
              </div>

                      <div>
          <label style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
            ORGANIZATION <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>(optional)</span>
          </label>
          <input
            placeholder="e.g. Raydium Tech; Technology Sector..."
            value={form.organization}
            onChange={e => setForm({...form, organization: e.target.value})}
            style={inputStyle("occupation")}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"}
          />
        </div>

              <div>
                <label style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
                  YOUR MESSAGE TO THE NATIONAL ASSEMBLY <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>(optional)</span>
                </label>
                <textarea
                  placeholder="Tell them why this matters to you..."
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  rows={3}
                  style={{ ...inputStyle("message"), resize: "vertical", lineHeight: "1.6" }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"}
                />
              </div>


              {errors.submit && (
              <p style={{ color: "#e74c3c", fontSize: "13px", textAlign: "center", padding: "8px", background: "rgba(231,76,60,0.1)", borderRadius: "8px" }}>
                ⚠️ {errors.submit}
              </p>
            )}
              

              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11.5px", lineHeight: "1.5" }}>
                🔒 Your data is used solely for this advocacy petition. We do not sell or share personal information.
              </p>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  background: loading ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, var(--gold), var(--gold-light))",
                  color: "var(--forest)",
                  border: "none",
                  padding: "18px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "700",
                  fontFamily: "'Playfair Display', serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  animation: loading ? "none" : "pulse 2s infinite",
                }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(201,168,76,0.4)"; }}}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {loading ? (
                  <>
                    <div style={{ width: "20px", height: "20px", border: "3px solid var(--forest)", borderTopColor: "transparent", borderRadius: "50%", animation: "rotate 0.8s linear infinite" }} />
                    Recording your signature...
                  </>
                ) : (
                  <>✍️  Sign the Petition &amp; Unlock Report</>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── THANK YOU STEP ── */
          <div style={{ padding: "50px 40px", textAlign: "center" }}>
            <div style={{
              width: "80px", height: "80px",
              background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", margin: "0 auto 24px",
              animation: "countUp 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 0 40px rgba(201,168,76,0.4)",
            }}>✓</div>

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "28px", color: "white",
              marginBottom: "12px",
            }}>Your Voice Has Been Recorded</h2>

            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.7", marginBottom: "32px" }}>
              You are now part of <strong style={{ color: "var(--gold)" }}>the {(sigCount).toLocaleString()} Nigerians</strong> demanding 
              democratic inclusion. Your signature will be delivered to the National Assembly as part of our formal advocacy campaign.
            </p>

            {/* Share prompt */}
            <div style={{
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "12px", padding: "20px", marginBottom: "28px",
            }}>
              <p style={{ color: "var(--gold)", fontSize: "13px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", marginBottom: "12px" }}>
                MULTIPLY YOUR IMPACT — SHARE THIS CAMPAIGN
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { icon: "𝕏", label: "Share on X", color: "#000", bg: "white", href: "https://twitter.com/intent/tweet?text=I+just+signed+the+petition+for+%23DiasporaVoting+in+Nigeria.+20M+Nigerians+abroad+deserve+the+right+to+vote.+Join+me+%40FixPolitics+%23FixPolitics&url=https%3A%2F%2Fdiasporavoting.vercel.app" },
                  { icon: "in", label: "LinkedIn", color: "white", bg: "#0077b5", href: "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fdiasporavoting.vercel.app" },
                  { icon: "💬", label: "WhatsApp", color: "white", bg: "#25D366", href: "https://wa.me/?text=I+just+signed+the+petition+for+Diaspora+Voting+in+Nigeria.+Join+me+and+add+your+voice+for+democratic+inclusion+%E2%80%94+https%3A%2F%2Fdiasporavoting.vercel.app" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                    background: s.bg, color: s.color,
                    padding: "10px 18px", borderRadius: "8px",
                    textDecoration: "none", fontSize: "13px",
                    fontWeight: "600", display: "flex", alignItems: "center", gap: "6px",
                  }}>
                    <span>{s.icon}</span> {s.label}
                  </a>
                ))}
              </div>
            </div>
           

            {/* Download button */}
            <a
              href="https://drive.google.com/uc?export=download&id=1OntMOsZR3ESPyuyjKZhYPL0bflweoMf-"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSigned}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                background: "linear-gradient(135deg, var(--forest-mid), var(--forest-light))",
                color: "white",
                padding: "20px 32px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: "700",
                fontFamily: "'Playfair Display', serif",
                border: "1px solid rgba(201,168,76,0.4)",
                transition: "all 0.2s",
                marginBottom: "16px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
            >
              <span style={{ fontSize: "22px" }}>📄</span>
              Download the Full Policy Report
              <span style={{ background: "var(--gold)", color: "var(--forest)", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>PDF</span>
            </a>

            <button onClick={onClose} style={{
              background: "none", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)", padding: "10px 24px",
              borderRadius: "8px", cursor: "pointer", fontSize: "13px",
              fontFamily: "'Source Serif 4', serif",
            }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [sigCount, setSigCount] = useState(1247);
  const [dlCount, setDlCount] = useState(389);
  const [hasSigned, setHasSigned] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const heroRef = useRef(null);

  // Load counts from storage
useEffect(() => {
  fetch("/api/stats")
    .then(r => r.json())
    .then(data => {
      setSigCount(data.sigCount || 1247);
      setDlCount(data.dlCount || 389);
    })
    .catch(() => {});
}, []);

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(prev => ({ ...prev, [(entry.target as HTMLElement).dataset.reveal as string]: true }));
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSign = async () => {
    const newCount = sigCount + 1;
    setSigCount(newCount);
    setHasSigned(true);
    try {
    } catch {}
  };

  const handleDownloadCount = async () => {
    const newDl = dlCount + 1;
    setDlCount(newDl);
    try {
    } catch {}
  };

  const revealStyle = (key: string, delay = 0) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(40px)",
    transition: `opacity 0.8s ${delay}s ease, transform 0.8s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
  });

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Source Serif 4', serif" }}>
      <FontLoader />

      {/* ── FIXED NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
        padding: "0 32px",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navScrolled ? "rgba(0,30,12,0.96)" : "transparent",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(201,168,76,0.2)" : "none",
        transition: "all 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
            borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono',monospace", fontWeight: "500", fontSize: "11px",
            color: "var(--forest)",
          }}>#FP</div>
          <span style={{ color: "white", fontSize: "13px", fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px" }}>
            FixPolitics Diaspora Initiative
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{
            background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "20px", padding: "5px 14px",
            color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace",
          }}>
            ✍️ {sigCount.toLocaleString()} signed
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "var(--gold)", color: "var(--forest)",
              border: "none", padding: "10px 20px",
              borderRadius: "8px", cursor: "pointer",
              fontSize: "13px", fontWeight: "700",
              fontFamily: "'Playfair Display',serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--gold-light)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--gold)"}
          >
            Sign Now
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* Background image */}
       <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/votersadvocacy.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        filter: "brightness(0.25)",
      }} />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, rgba(0,61,26,0.92) 0%, rgba(0,20,8,0.97) 60%, rgba(0,0,0,0.99) 100%)",
        }} />
        {/* Gold diagonal accent */}
        <div style={{
          position: "absolute", right: 0, top: 0,
          width: "40%", height: "100%",
          background: "linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.06) 100%)",
          pointerEvents: "none",
        }} />
        {/* Nigerian flag colors — subtle vertical stripe */}
        <div style={{ position: "absolute", left: 0, top: 0, width: "5px", height: "100%", background: "linear-gradient(180deg, var(--gold), var(--forest-light), var(--gold))" }} />

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: "1100px", margin: "0 auto",
          padding: "120px 32px 80px",
          width: "100%",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)",
            borderRadius: "20px", padding: "8px 18px",
            marginBottom: "32px",
            animation: "fadeUp 0.8s 0.2s both",
          }}>
            <span style={{ color: "white", fontSize: "16px" }}>🇳🇬</span>
            <span style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1.5px" }}>
              #FIXPOLITICS DIASPORA INITIATIVE · FEBRUARY 2026
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(40px, 7vw, 76px)",
            lineHeight: "1.1",
            color: "white",
            marginBottom: "12px",
            animation: "fadeUp 0.8s 0.35s both",
          }}>
            20 Million Nigerians<br/>
            <em style={{ color: "var(--gold)" }}>Abroad.</em>
          </h1>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(36px, 6vw, 66px)",
            lineHeight: "1.1",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "32px",
            animation: "fadeUp 0.8s 0.45s both",
          }}>
            Zero Votes Cast.
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "rgba(255,255,255,0.75)",
            lineHeight: "1.7",
            maxWidth: "600px",
            marginBottom: "48px",
            fontStyle: "italic",
            animation: "fadeUp 0.8s 0.55s both",
          }}>
            They send home <strong style={{ color: "var(--gold)" }}>$20.93 billion every year.</strong> They build 
            hospitals, fund schools, and keep families alive. They are Nigeria's 
            most significant economic support community. And they cannot vote.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: "flex", gap: "16px", flexWrap: "wrap",
            animation: "fadeUp 0.8s 0.65s both",
          }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
                color: "var(--forest)",
                border: "none",
                padding: "20px 36px",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "17px",
                fontWeight: "700",
                fontFamily: "'Playfair Display', serif",
                animation: "pulse 2.5s 2s infinite",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(201,168,76,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(201,168,76,0.35)"; }}
            >
              ✍️ Sign the Petition &amp; Download Report
            </button>
            <a href="#the-case" style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.2)",
              padding: "20px 32px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "16px",
              fontFamily: "'Source Serif 4', serif",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            >
              Read the Case →
            </a>
          </div>

          {/* Live counter bar */}
          <div style={{
            marginTop: "64px",
            display: "flex", gap: "0", flexWrap: "wrap",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "32px",
            animation: "fadeUp 0.8s 0.8s both",
          }}>
            {[
              { val: sigCount, label: "Petition Signatures", icon: "✍️", isLive: true },
              { val: dlCount, label: "Report Downloads", icon: "📄", isLive: true },
              { val: 20000000, label: "Nigerians in Diaspora", icon: "🌍", suffix: "+" },
              { val: 20930000000, label: "Annual Remittances (2024)", icon: "💰", prefix: "$", suffix: "B", display: "20.93B" },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: "1", minWidth: "140px",
                padding: "0 32px 0 0",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
                marginRight: i < 3 ? "32px" : "0",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>{stat.icon}</div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(22px, 3vw, 32px)",
                  fontWeight: "700",
                  color: "white",
                  lineHeight: "1",
                  marginBottom: "6px",
                }}>
                  {stat.isLive ? (
                    <span style={{ 
                      background: "linear-gradient(90deg, white, var(--gold), white)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "shimmer 3s linear infinite",
                    }}>
                      {stat.val.toLocaleString()}
                    </span>
                  ) : (
                    stat.display || `${stat.prefix || ""}${stat.val.toLocaleString()}${stat.suffix || ""}`
                  )}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px" }}>
                  {stat.label}
                  {stat.isLive && <span style={{ marginLeft: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "5px", height: "5px", background: "var(--gold)", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                    LIVE
                  </span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          animation: "floatBob 2s ease-in-out infinite",
          color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center",
          fontFamily: "'DM Mono',monospace",
        }}>
          <div style={{ fontSize: "20px" }}>↓</div>
          scroll
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: "var(--gold)", padding: "12px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "marquee 25s linear infinite", width: "max-content" }}>
          {Array(3).fill([
            "🇳🇬 20M+ Nigerians abroad cannot vote",
            "💰 $20.93 Billion remitted in 2024",
            "📜 30+ African nations have diaspora voting",
            "🏛️ The National Assembly must act now",
            "✍️ Sign the petition · Download the report",
            "🌍 Citizenship does not expire at the departure gate",
          ]).flat().map((t, i) => (
            <span key={i} style={{
              padding: "0 32px",
              color: "var(--forest)", fontSize: "13px",
              fontFamily: "'DM Mono',monospace", fontWeight: "500",
              letterSpacing: "0.5px", whiteSpace: "nowrap",
            }}>
              {t} &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>


      {/* ── DOCUMENT READER ── */}
<section style={{ background: "var(--ivory)", padding: "80px 32px 60px" }}>
  <div style={{ maxWidth: "900px", margin: "0 auto" }}>

    {/* Section label */}
    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
      <div style={{ height: "3px", width: "48px", background: "var(--gold)", flexShrink: 0 }} />
      <span style={{ color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: "2px" }}>
        READ BEFORE YOU SIGN
      </span>
    </div>

    <h2 style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: "clamp(26px, 4vw, 40px)",
      color: "var(--forest)",
      lineHeight: "1.2",
      marginBottom: "12px",
    }}>
      The Full Policy Report —<br/>
      <em>Read It. Then Add Your Voice.</em>
    </h2>

    <p style={{
      fontSize: "16px", lineHeight: "1.8",
      color: "var(--charcoal)", marginBottom: "32px", maxWidth: "680px",
    }}>
      This is the complete policy and advocacy memorandum prepared for the National Assembly.
      Read it in full below, then sign the petition at the bottom to add your name to the formal
      legislative record.
    </p>

    {/* PDF Embed */}
    <div style={{
      border: "2px solid var(--gold)",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      background: "#f0f0f0",
    }}>
      {/* Document header bar */}
      <div style={{
        background: "var(--forest)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>📄</span>
          <span style={{
            color: "white", fontSize: "13px",
            fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px",
          }}>
            Why Diaspora Voting Matters Beyond Policy · #FixPolitics · Feb 2026
          </span>
        </div>
        
         <a href="https://drive.google.com/uc?export=download&confirm=t&id=1OntMOsZR3ESPyuyjKZhYPL0bflweoMf-"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "rgba(201,168,76,0.2)",
            border: "1px solid var(--gold)",
            color: "var(--gold)",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "'DM Mono',monospace",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          ↓ Download PDF
        </a>
      </div>

      {/* The PDF iframe */}
      <iframe
        src="https://drive.google.com/file/d/1OntMOsZR3ESPyuyjKZhYPL0bflweoMf-/preview"
        style={{
          width: "100%",
          height: "780px",
          border: "none",
          display: "block",
        }}
        allow="autoplay"
        title="Why Diaspora Voting Matters Beyond Policy"
      />
    </div>

    {/* Sign CTA below document */}
    <div style={{
      marginTop: "40px",
      background: "var(--forest)",
      borderRadius: "16px",
      padding: "40px 36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "24px",
      border: "2px solid var(--gold)",
    }}>
      <div>
        <div style={{
          color: "var(--gold)", fontSize: "11px",
          fontFamily: "'DM Mono',monospace", letterSpacing: "2px",
          marginBottom: "8px",
        }}>
          YOU&apos;VE READ IT. NOW ACT.
        </div>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(20px, 3vw, 28px)",
          color: "white", lineHeight: "1.3", margin: 0,
        }}>
          Add your name to the<br/>
          <em style={{ color: "var(--gold)" }}>official petition record.</em>
        </h3>
        <p style={{
          color: "rgba(255,255,255,0.6)", fontSize: "14px",
          lineHeight: "1.6", marginTop: "10px", marginBottom: 0,
          maxWidth: "420px",
        }}>
          Your signature joins thousands of Nigerians demanding constitutional change.
          It will be formally presented to the House of Representatives and Senate.
        </p>
      </div>
      <button
        onClick={() => setShowModal(true)}
        style={{
          background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
          color: "var(--forest)",
          border: "none",
          padding: "20px 36px",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "700",
          fontFamily: "'Playfair Display', serif",
          boxShadow: "0 8px 32px rgba(201,168,76,0.4)",
          whiteSpace: "nowrap",
          transition: "all 0.2s",
          animation: "pulse 2.5s infinite",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
      >
        ✍️ Sign the Petition Now
      </button>
    </div>

  </div>
</section>

      
      {/* ── THE CRISIS ── */}
      <section id="the-case" style={{ background: "var(--ivory)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Section label */}
          <div data-reveal="crisis" style={{ ...revealStyle("crisis"), display: "flex", alignItems: "center", gap: "16px", marginBottom: "48px" }}>
            <div style={{ height: "3px", width: "48px", background: "var(--gold)" }} />
            <span style={{ color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: "2px" }}>THE DEMOCRATIC CRISIS</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div data-reveal="crisis-left" style={revealStyle("crisis-left")}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(32px, 4vw, 52px)",
                lineHeight: "1.2",
                color: "var(--forest)",
                marginBottom: "24px",
              }}>
                A Nation That Takes<br/>
                <em>Without Giving Back</em><br/>
                <span style={{ color: "var(--gold)" }}>Democratic Rights</span>
              </h2>
              <p style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--charcoal)", marginBottom: "20px" }}>
                Nigeria's diaspora sends home more money than the country receives in Foreign Direct Investment — 
                every single year. In 2024 alone, that figure was <strong>$20.93 billion</strong>. Four times the 
                country's FDI.
              </p>
              <p style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--charcoal)", marginBottom: "32px" }}>
                These are doctors in London, engineers in Houston, teachers in Dubai — people who own property 
                in Nigeria, support extended families, build businesses, create jobs. And yet, when Nigeria 
                holds an election, their voices are entirely absent.
              </p>
              <div style={{
                borderLeft: "4px solid var(--gold)",
                paddingLeft: "20px",
                fontFamily: "'Playfair Display', serif",
                fontSize: "19px",
                fontStyle: "italic",
                color: "var(--forest)",
                lineHeight: "1.6",
              }}>
                "Citizenship does not expire at the airport departure gate."
              </div>
            </div>

            <div data-reveal="crisis-right" style={{ ...revealStyle("crisis-right"), display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Image */}
              <div style={{
                borderRadius: "16px", overflow: "hidden",
                height: "240px", position: "relative",
              }}>
                <img
                  src="/nigeriansindiaspora.jpeg"
                  alt="Nigerians voting"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", bottom: "16px", left: "16px",
                  background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
                  padding: "8px 14px", borderRadius: "8px",
                  color: "white", fontSize: "12px", fontFamily: "'DM Mono',monospace",
                }}>
                  2025 Diaspora Advocacy at the National Assembly
                </div>
              </div>

              {/* Stat cards */}
              {[
                { num: "$20.93B", label: "Diaspora Remittances (2024)", note: "4× Nigeria's total FDI", color: "var(--forest)" },
                { num: "115+", label: "Countries Allow External Voting", note: "Nigeria is the outlier", color: "#8B2635" },
                { num: "30+", label: "African Nations with Diaspora Voting", note: "Senegal, South Africa, Kenya, Ghana...", color: "var(--forest-mid)" },
              ].map((card, i) => (
                <div key={i} style={{
                  background: card.color,
                  color: "white",
                  borderRadius: "12px",
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  animation: visible["crisis-right"] ? `fadeUp 0.5s ${0.1 * i}s both` : "none",
                }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "28px", fontWeight: "700", lineHeight: "1" }}>{card.num}</div>
                    <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>{card.label}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.15)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", maxWidth: "120px", textAlign: "right" }}>
                    {card.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BIG NUMBERS ── */}
      <section style={{
        background: "var(--forest)",
        padding: "100px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* BG pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.05) 0%, transparent 40%)",
        }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
          <div data-reveal="numbers" style={{ ...revealStyle("numbers"), textAlign: "center", marginBottom: "64px" }}>
            <div style={{ color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>THE NUMBERS THAT DEMAND ACTION</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(32px,5vw,52px)", color: "white", lineHeight: "1.2" }}>
              The Economic Case Is<br/><em style={{ color: "var(--gold)" }}>Undeniable</em>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }} data-reveal="num-cards">
            {[
              { num: 20.93, suffix: "B", prefix: "$", label: "Remittances sent home (2024)", sub: "CBN Annual Report 2024", color: "var(--gold)" },
              { num: 4, suffix: "×", prefix: "", label: "Times more than Nigeria's FDI", sub: "President Tinubu, NiDCOM 2025", color: "white" },
              { num: 61, suffix: "%", prefix: "+", label: "Growth in formal remittances", sub: "CBN Governor Cardoso, Dec 2024", color: "var(--gold)" },
              { num: 20, suffix: "M+", prefix: "", label: "Nigerians living abroad", sub: "NiDCOM / World Bank", color: "white" },
              { num: 37, suffix: "%", prefix: "", label: "Of Sub-Saharan Africa's remittances", sub: "World Bank, 2024", color: "var(--gold)" },
              { num: 5, suffix: "%", prefix: "~", label: "Of Nigeria's GDP from diaspora", sub: "Africa Check / World Bank", color: "white" },
            ].map((stat, i) => (
              <div key={i} data-reveal={`nc${i}`} style={{
                ...revealStyle(`nc${i}`, i * 0.1),
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "32px 24px",
                textAlign: "center",
                transition: "all 0.3s",
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.1)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "42px", fontWeight: "900",
                  color: stat.color,
                  lineHeight: "1",
                  marginBottom: "12px",
                }}>
                  <AnimatedNumber target={stat.num} duration={1800} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.4", marginBottom: "8px" }}>{stat.label}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GLOBAL CONTEXT ── */}
      <section style={{ background: "var(--cream)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div data-reveal="global" style={{ ...revealStyle("global"), display: "flex", alignItems: "center", gap: "16px", marginBottom: "48px" }}>
            <div style={{ height: "3px", width: "48px", background: "var(--gold)" }} />
            <span style={{ color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: "2px" }}>NIGERIA IS FALLING BEHIND</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div data-reveal="global-left">
              <h2 style={{ ...revealStyle("global-left"), fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,44px)", color: "var(--forest)", lineHeight: "1.2", marginBottom: "24px" }}>
                Africa Is Moving Forward.<br/><em>Nigeria Is Standing Still.</em>
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--charcoal)", marginBottom: "32px" }}>
                Over 30 African nations — including Senegal, South Africa, Kenya, Ghana, and Rwanda — 
                have enabled their diaspora to vote. Nigeria, the continent's largest democracy and economy, 
                is an outlier. This is not just a democratic embarrassment. It is a missed opportunity 
                to deepen national legitimacy, strengthen remittance flows, and elevate accountability.
              </p>

              {/* Country grid */}
              <div style={{ color: "white", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px" }}>
                {[
                  { flag: "🇸🇳", country: "Senegal", year: "2006", note: "15 diaspora seats" },
                  { flag: "🇿🇦", country: "South Africa", year: "1994", note: "Full rights" },
                  { flag: "🇰🇪", country: "Kenya", year: "2010", note: "12 countries" },
                  { flag: "🇬🇭", country: "Ghana", year: "2008", note: "Mission voting" },
                  { flag: "🇷🇼", country: "Rwanda", year: "2003", note: "Full rights" },
                  { flag: "🇳🇪", country: "Niger", year: "Post-2000", note: "Reserved seats" },
                  { flag: "🇨🇮", country: "Côte d'Ivoire", year: "2015", note: "Enabled" },
                  { flag: "🇳🇬", country: "Nigeria", year: "???", note: "EXCLUDED", highlight: true },
                ].map((c, i) => (
                  <div key={i} style={{
                    background: c.highlight ? "#8B2635" : "var(--forest)",
                    borderRadius: "10px", padding: "12px",
                    textAlign: "center",
                    border: c.highlight ? "2px solid #c0392b" : "2px solid transparent",
                    animation: visible["global-left"] ? `fadeUp 0.4s ${i * 0.06}s both` : "none",
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "4px" }}>{c.flag}</div>
                    <div style={{ color: "white", fontSize: "11px", fontWeight: "600", marginBottom: "2px" }}>{c.country}</div>
                    <div style={{ color: c.highlight ? "#ff9999" : "var(--gold)", fontSize: "10px", fontFamily: "'DM Mono',monospace" }}>{c.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image column */}
            <div data-reveal="global-right" style={{ ...revealStyle("global-right", 0.2), display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ borderRadius: "16px", overflow: "hidden", height: "300px" }}>
                <img
                  src="/voteabroad.jpeg"
                  alt="African parliament"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{
                background: "var(--forest)", borderRadius: "16px", padding: "28px",
                border: "1px solid rgba(201,168,76,0.3)",
              }}>
                <div style={{ color: "var(--gold)", fontSize: "12px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", marginBottom: "12px" }}>
                  THE RIPPLE EFFECT
                </div>
                <div style={{ color: "white", fontSize: "15px", lineHeight: "1.7" }}>
                  Diaspora voting doesn't just add votes — it <strong style={{ color: "var(--gold)" }}>transforms accountability</strong>. 
                  Diaspora voters have seen functioning governance. They vote to a higher standard. 
                  Politicians must compete for their support — and that <strong style={{ color: "var(--gold)" }}>raises the entire bar.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT SIGNING DOES ── */}
      <section style={{ background: "var(--forest)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <div data-reveal="impact" style={revealStyle("impact")}>
            <div style={{ color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>YOUR SIGNATURE MOVES THE NEEDLE</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(30px,5vw,50px)", color: "white", lineHeight: "1.2", marginBottom: "16px" }}>
              This Isn't a Form.<br/><em style={{ color: "var(--gold)" }}>This Is a Constitutional Claim.</em>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", maxWidth: "620px", margin: "0 auto 64px", lineHeight: "1.7" }}>
              Every signature is documented evidence presented to the National Assembly. 
              Here is exactly what happens when you sign:
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "64px" }}>
            {[
              { step: "01", icon: "✍️", title: "You Sign", body: "Your name, country and optional message are recorded in the formal advocacy petition database." },
              { step: "02", icon: "📊", title: "We Document", body: "Signatures are compiled with demographic data showing Nigerian diaspora breadth across 50+ countries." },
              { step: "03", icon: "🏛️", title: "We Deliver", body: "The petition and Policy Report are formally presented to the House of Representatives and Senate." },
              { step: "04", icon: "📣", title: "They Cannot Ignore", body: "Thousands of unified voices, backed by economic data and constitutional argument, change legislation." },
            ].map((s, i) => (
              <div key={i} data-reveal={`step${i}`} style={{
                ...revealStyle(`step${i}`, i * 0.15),
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "16px",
                padding: "32px 24px",
                position: "relative",
                transition: "all 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: "11px",
                  color: "var(--gold)", letterSpacing: "2px",
                  marginBottom: "12px",
                }}>STEP {s.step}</div>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{s.icon}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", color: "white", marginBottom: "12px" }}>{s.title}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.6" }}>{s.body}</div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div data-reveal="final-cta" style={revealStyle("final-cta")}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
                color: "var(--forest)",
                border: "none",
                padding: "22px 48px",
                borderRadius: "14px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "700",
                fontFamily: "'Playfair Display',serif",
                transition: "all 0.2s",
                boxShadow: "0 8px 40px rgba(201,168,76,0.3)",
                animation: "pulse 2.5s infinite",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              ✍️ Add My Voice — Sign &amp; Download
            </button>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "16px", fontFamily: "'DM Mono',monospace" }}>
              {sigCount.toLocaleString()} signatures · {dlCount.toLocaleString()} downloads
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE SECTION ── */}
      <section style={{ background: "var(--ivory)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div data-reveal="quote" style={revealStyle("quote")}>
            <div style={{ fontSize: "80px", color: "var(--gold)", fontFamily: "'Playfair Display',serif", lineHeight: "0.5", marginBottom: "32px", opacity: 0.5 }}>"</div>
            <blockquote style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(20px,3vw,30px)",
              lineHeight: "1.6",
              color: "var(--forest)",
              fontStyle: "italic",
              marginBottom: "24px",
            }}>
              The true measure of a democracy is not the quality of elections it holds for those 
              conveniently within its borders. It is whether it reaches for those citizens who are 
              furthest away — and says: <strong style={{ fontStyle: "normal", color: "var(--gold)" }}>
              you are still one of us. Your voice matters. Your vote counts.
              </strong>
            </blockquote>
            <div style={{ color: "var(--muted)", fontSize: "14px", fontFamily: "'DM Mono',monospace", letterSpacing: "1px" }}>
              — WHY DIASPORA VOTING MATTERS BEYOND POLICY · #FIXPOLITICS DIASPORA INITIATIVE, 2026
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT THE REPORT ── */}
      <section style={{ background: "var(--cream)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div data-reveal="report-left" style={revealStyle("report-left")}>
              {/* Report mockup */}
              <div style={{
                background: "var(--forest)",
                borderRadius: "16px",
                padding: "40px",
                border: "4px solid var(--gold)",
                boxShadow: "20px 20px 0px var(--gold)",
                position: "relative",
                animation: "floatBob 4s ease-in-out infinite",
              }}>
                {/* Top gold bar */}
                <div style={{ height: "4px", background: "linear-gradient(90deg, var(--gold), var(--gold-light))", marginBottom: "24px", borderRadius: "2px" }} />
                <div style={{ color: "var(--gold)", fontSize: "10px", fontFamily: "'DM Mono',monospace", letterSpacing: "2px", marginBottom: "8px" }}>#FIXPOLITICS DIASPORA INITIATIVE</div>
                <div style={{ color: "white", fontFamily: "'Playfair Display',serif", fontSize: "22px", lineHeight: "1.3", marginBottom: "16px" }}>
                  Why Diaspora Voting<br/>Matters Beyond Policy
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "24px" }}>
                  A comprehensive policy & advocacy memorandum presenting the democratic, economic, and legal case for immediate constitutional reform
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                  {["8 Pages", "10 Sections", "Global Data", "Legal Analysis", "Action Plan"].map(t => (
                    <span key={t} style={{
                      background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                      color: "var(--gold)", padding: "4px 10px", borderRadius: "20px",
                      fontSize: "10px", fontFamily: "'DM Mono',monospace",
                    }}>{t}</span>
                  ))}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>
                  FEBRUARY 2026 · FINAL ADVOCACY DRAFT
                </div>
              </div>
            </div>

            <div data-reveal="report-right" style={revealStyle("report-right", 0.2)}>
              <div style={{ color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: "2px", marginBottom: "16px" }}>THE POLICY REPORT</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,40px)", color: "var(--forest)", lineHeight: "1.2", marginBottom: "20px" }}>
                A Comprehensive<br/><em>Diaspora Voting Document</em><br/>Ever Produced for Nigeria
              </h2>
              <p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--charcoal)", marginBottom: "28px" }}>
                Sign the petition and gain immediate access to the full 8-page policy and advocacy 
                memorandum — packed with original research, legal analysis, global comparisons, 
                a phased implementation roadmap, and direct recommendations to the National Assembly.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
                {[
                  "✓  Updated 2024 remittance data and economic analysis",
                  "✓  Constitutional law breakdown — exactly what must change",
                  "✓  Lessons from 30+ African diaspora voting models",
                  "✓  Phased implementation roadmap for 2031 elections",
                  "✓  Specific recommendations to NASS, INEC, Presidency",
                ].map((point, i) => (
                  <div key={i} style={{ color: "var(--charcoal)", fontSize: "15px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--forest)", flexShrink: 0 }}>{point.substring(0, 1)}</span>
                    <span>{point.substring(2)}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: "var(--forest)",
                  color: "white",
                  border: "2px solid var(--forest)",
                  padding: "18px 32px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "700",
                  fontFamily: "'Playfair Display',serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--gold)"; (e.currentTarget as HTMLElement).style.color = "var(--forest)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest)"; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
              >
                📄 Sign &amp; Download the Report
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{
        background: "linear-gradient(160deg, var(--forest), var(--dark))",
        padding: "80px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        borderTop: "4px solid var(--gold)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 50%)",
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ color: "white", fontSize: "48px", marginBottom: "16px" }}>🇳🇬</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,5vw,44px)", color: "white", lineHeight: "1.3", marginBottom: "20px" }}>
            Every Signature Is a Vote<br/><em style={{ color: "var(--gold)" }}>For the Right to Vote</em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "17px", lineHeight: "1.7", marginBottom: "40px" }}>
            The 2031 elections are the natural target. With a constitutional amendments passed before 2031, 
            diaspora Nigerians will be able to vote for the first time in history. But only if we demand it — together.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
              color: "var(--forest)",
              border: "none",
              padding: "22px 52px",
              borderRadius: "14px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "700",
              fontFamily: "'Playfair Display',serif",
              boxShadow: "0 8px 40px rgba(201,168,76,0.35)",
              animation: "pulse 2.5s infinite",
              marginBottom: "20px",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
          >
            ✍️ Sign the Petition Now
          </button>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontFamily: "'DM Mono',monospace" }}>
            <span style={{ color: "var(--gold)" }}>{sigCount.toLocaleString()}</span> have already signed · <span style={{ color: "var(--gold)" }}>{dlCount.toLocaleString()}</span> downloads
          </div>

          <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", fontSize: "12px", fontFamily: "'DM Mono',monospace" }}>
            © 2026 #FixPolitics Diaspora Initiative · A Joint Policy and Advocacy Memorandum · fixpolitics.org
          </div>
        </div>
      </section>

      {/* ── PETITION MODAL ── */}
      {showModal && (
        <PetitionModal
          onClose={() => setShowModal(false)}
          onSigned={handleSign}
          sigCount={sigCount}
        />
      )}
    </div>
  );
}