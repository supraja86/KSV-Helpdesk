import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DESIGNATIONS = ["Unit Head", "HOD", "Class Teacher", "Subject Teacher"];
const CLASSES = ["Pre-KG","LKG","UKG","Std I","Std II","Std III","Std IV","Std V","Std VI","Std VII","Std VIII","Std IX","Std X","Std XI","Std XII"];
const SECTIONS = ["A","B","C","D"];
const CATEGORIES = ["Classroom Infrastructure","Furniture & Fixtures","Electrical / Lighting","Cleanliness & Hygiene","Student Behaviour","Academic Resources","IT & Technology","Safety & Security","Administrative Issue","Other"];

const ADMIN_USER = "KSV123";
const ADMIN_PASS = "Kola@123";

const STATUS_STYLES = {
  Pending:   { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Completed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
};

// ── Supabase helpers ─────────────────────────────────────────────────────
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getAllComplaints() {
  return await sbFetch("complaints?order=complaint_date.desc,created_at.desc");
}

async function insertComplaint(data) {
  return await sbFetch("complaints", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateStatus(id, status) {
  return await sbFetch(`complaints?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    prefer: "return=minimal",
  });
}

// ── Utils ────────────────────────────────────────────────────────────────
function generateId() { return "CMP" + Date.now().toString().slice(-6); }
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getWeekRange(weeksBack = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - weeksBack * 7);
  monday.setHours(0,0,0,0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);
  return { start: monday, end: sunday };
}

function getMonthRange(monthsBack = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function toCSV(rows) {
  const h = ["ID","Date of Complaint","Teacher Name","Designation","Class","Section","Category","Priority","Description","Status"];
  const lines = [h.join(",")];
  rows.forEach((r) => lines.push([
    r.id, r.complaint_date, `"${r.teacher_name}"`, `"${r.designation}"`,
    `"${r.class_name}"`, r.section, `"${r.category}"`, r.priority,
    `"${r.description.replace(/"/g,"'")}"`, r.status,
  ].join(",")));
  return lines.join("\n");
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Icons ────────────────────────────────────────────────────────────────
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconLogout = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconDownload = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconChevron = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IconEye = ({ show }) => show
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ── Shared input style ───────────────────────────────────────────────────
const inp = (err) => ({
  display:"block", width:"100%", padding:"13px 14px", fontSize:15,
  borderRadius:10, border:`1.5px solid ${err ? "#EF4444" : "#E2E8F0"}`,
  background:"#fff", color:"#1E293B", outline:"none",
  fontFamily:"inherit", boxSizing:"border-box", WebkitAppearance:"none",
});

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>{label}</label>
      {children}
      {error && <p style={{ margin:"5px 0 0", fontSize:12, color:"#EF4444" }}>{error}</p>}
    </div>
  );
}

function SelectWrap({ value, onChange, children, error }) {
  return (
    <div style={{ position:"relative" }}>
      <select value={value} onChange={onChange}
        style={{ ...inp(error), paddingRight:36, color: value ? "#1E293B" : "#94A3B8" }}>
        {children}
      </select>
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
        <IconChevron />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen]           = useState("complaint");
  const [complaints, setComplaints]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [dbError, setDbError]         = useState("");

  const [form, setForm] = useState({
    teacher:"", designation:"", cls:"", section:"",
    category:"", priority:"Medium", description:"", complaintDate: today(),
  });
  const [errors, setErrors] = useState({});

  const [loginUser, setLoginUser]   = useState("");
  const [loginPass, setLoginPass]   = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [loginError, setLoginError] = useState("");

  const [filterPeriod, setFilterPeriod]   = useState("all");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [expandedId, setExpandedId]       = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fetchComplaints = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    setLoading(true);
    setDbError("");
    try {
      const data = await getAllComplaints();
      setComplaints(data || []);
    } catch (e) {
      setDbError("Could not load complaints. Check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (screen === "dashboard") fetchComplaints();
  }, [screen, fetchComplaints]);

  function validate() {
    const e = {};
    if (!form.teacher.trim())        e.teacher        = "Required";
    if (!form.designation)           e.designation    = "Required";
    if (!form.cls)                   e.cls            = "Required";
    if (!form.section)               e.section        = "Required";
    if (!form.category)              e.category       = "Required";
    if (!form.complaintDate)         e.complaintDate  = "Required";
    if (form.description.trim().length < 10) e.description = "Min 10 characters";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitLoading(true);
    setDbError("");
    const id = generateId();
    try {
      await insertComplaint({
        id,
        complaint_date: form.complaintDate,
        teacher_name:   form.teacher.trim(),
        designation:    form.designation,
        class_name:     form.cls,
        section:        form.section,
        category:       form.category,
        priority:       form.priority,
        description:    form.description.trim(),
        status:         "Pending",
      });
      setSubmittedId(id);
      setSubmitted(true);
      setForm({ teacher:"", designation:"", cls:"", section:"", category:"", priority:"Medium", description:"", complaintDate: today() });
      setErrors({});
    } catch (e) {
      setDbError("Failed to submit. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleLogin() {
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      setLoginError("");
      setScreen("dashboard");
    } else {
      setLoginError("Invalid User ID or Password.");
    }
  }

  function handleLogout() {
    setScreen("complaint");
    setLoginUser(""); setLoginPass("");
  }

  async function handleStatusChange(id, status) {
    try {
      await updateStatus(id, status);
      setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    } catch {
      alert("Could not update status. Please try again.");
    }
  }

  function getFiltered() {
    return complaints.filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterPeriod === "all") return true;
      const d = new Date(c.complaint_date);
      if (filterPeriod.startsWith("w")) {
        const { start, end } = getWeekRange(parseInt(filterPeriod.slice(1)));
        return d >= start && d <= end;
      }
      if (filterPeriod.startsWith("m")) {
        const { start, end } = getMonthRange(parseInt(filterPeriod.slice(1)));
        return d >= start && d <= end;
      }
      return true;
    });
  }

  function exportReport() {
    const rows = getFiltered();
    if (!rows.length) { alert("No complaints for the selected period."); return; }
    const label = filterPeriod === "all" ? "All" :
      filterPeriod.startsWith("w") ? `Week${filterPeriod.slice(1)}` :
      `Month${filterPeriod.slice(1)}`;
    downloadCSV(toCSV(rows), `KSV_Complaints_${label}_${today()}.csv`);
  }

  const filtered = getFiltered();
  const pendingCount   = complaints.filter((c) => c.status === "Pending").length;
  const completedCount = complaints.filter((c) => c.status === "Completed").length;

  const wrap = { minHeight:"100vh", background:"#F1F5F9", fontFamily:"'Inter','Segoe UI',sans-serif", maxWidth:480, margin:"0 auto" };
  const header = (title, sub) => (
    <div style={{ background:"#1E293B", padding:"16px 20px 14px", position:"sticky", top:0, zIndex:50 }}>
      <div style={{ fontSize:11, color:"#94A3B8", letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>
        Kola Saraswathi Vaishnav Sr. Sec. School
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:18, fontWeight:700, color:"#fff" }}>{title}</div>
        {sub}
      </div>
    </div>
  );

  // ══ COMPLAINT FORM ══════════════════════════════════════════════════════
  if (screen === "complaint") return (
    <div style={wrap}>
      {header("Staff Helpdesk",
        <button onClick={() => setScreen("login")}
          style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", color:"#CBD5E1", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          <IconLock /> Admin
        </button>
      )}
      <div style={{ padding:"20px 16px 40px" }}>
        {!submitted ? (
          <>
            <p style={{ fontSize:14, color:"#64748B", margin:"0 0 18px" }}>Fill in the details below to register a complaint.</p>
            {dbError && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#DC2626" }}>{dbError}</div>}
            <div style={{ background:"#fff", borderRadius:16, padding:"20px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>

              <Field label="Teacher Name *" error={errors.teacher}>
                <input style={inp(errors.teacher)} placeholder="Enter your full name"
                  value={form.teacher} onChange={(e) => set("teacher", e.target.value)} />
              </Field>

              <Field label="Designation *" error={errors.designation}>
                <SelectWrap value={form.designation} onChange={(e) => set("designation", e.target.value)} error={errors.designation}>
                  <option value="">Select designation</option>
                  {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
                </SelectWrap>
              </Field>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Class *" error={errors.cls}>
                  <SelectWrap value={form.cls} onChange={(e) => set("cls", e.target.value)} error={errors.cls}>
                    <option value="">Select</option>
                    {CLASSES.map((c) => <option key={c}>{c}</option>)}
                  </SelectWrap>
                </Field>
                <Field label="Section *" error={errors.section}>
                  <SelectWrap value={form.section} onChange={(e) => set("section", e.target.value)} error={errors.section}>
                    <option value="">Sec</option>
                    {SECTIONS.map((s) => <option key={s}>{s}</option>)}
                  </SelectWrap>
                </Field>
              </div>

              <Field label="Date of Complaint *" error={errors.complaintDate}>
                <input type="date" style={inp(errors.complaintDate)} value={form.complaintDate}
                  onChange={(e) => set("complaintDate", e.target.value)} />
              </Field>

              <Field label="Category *" error={errors.category}>
                <SelectWrap value={form.category} onChange={(e) => set("category", e.target.value)} error={errors.category}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </SelectWrap>
              </Field>

              <Field label="Priority">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["Low","#F0FDF4","#16A34A","#86EFAC"],["Medium","#FFFBEB","#D97706","#FCD34D"],["High","#FEF2F2","#DC2626","#FCA5A5"]].map(([p,bg,col,border]) => (
                    <button key={p} onClick={() => set("priority", p)}
                      style={{ padding:"12px 0", borderRadius:10, fontWeight:700, fontSize:14,
                        border:`2px solid ${form.priority===p ? border : "#E2E8F0"}`,
                        background: form.priority===p ? bg : "#F8FAFC",
                        color: form.priority===p ? col : "#94A3B8", cursor:"pointer" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Description of Issue *" error={errors.description}>
                <textarea style={{ ...inp(errors.description), minHeight:110, resize:"vertical", lineHeight:1.6 }}
                  placeholder="Describe the issue — what happened, where, since when…"
                  value={form.description} onChange={(e) => set("description", e.target.value)} />
                <p style={{ margin:"4px 0 0", fontSize:11, color:"#94A3B8", textAlign:"right" }}>{form.description.length} chars</p>
              </Field>

              <button onClick={handleSubmit} disabled={submitLoading}
                style={{ width:"100%", padding:"15px", borderRadius:12, fontSize:16, fontWeight:700,
                  background: submitLoading ? "#94A3B8" : "#1E293B", color:"#fff", border:"none", cursor: submitLoading ? "not-allowed" : "pointer", marginTop:4 }}>
                {submitLoading ? "Submitting…" : "Submit Complaint →"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign:"center", paddingTop:48 }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>✓</div>
            <h2 style={{ fontSize:22, fontWeight:700, color:"#1E293B", margin:"0 0 8px" }}>Complaint Registered!</h2>
            <p style={{ color:"#64748B", fontSize:15, margin:"0 0 24px" }}>Your complaint has been submitted to the admin team.</p>
            <div style={{ background:"#fff", borderRadius:14, padding:"16px 24px", display:"inline-block", marginBottom:28, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, color:"#94A3B8", marginBottom:4 }}>Complaint ID</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#1E293B", letterSpacing:1 }}>{submittedId}</div>
            </div>
            <br />
            <button onClick={() => setSubmitted(false)}
              style={{ padding:"14px 32px", borderRadius:12, background:"#1E293B", color:"#fff", fontWeight:700, fontSize:15, border:"none", cursor:"pointer" }}>
              Raise Another Complaint
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ══ LOGIN ═══════════════════════════════════════════════════════════════
  if (screen === "login") return (
    <div style={{ ...wrap, display:"flex", flexDirection:"column" }}>
      {header("Admin Login", null)}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"32px 20px" }}>
        <div style={{ background:"#fff", borderRadius:20, padding:"28px 20px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <IconLock />
            </div>
            <div style={{ fontWeight:700, fontSize:17, color:"#1E293B" }}>Administrative Access</div>
            <div style={{ fontSize:13, color:"#94A3B8", marginTop:4 }}>Authorised personnel only</div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>User ID</label>
            <input style={inp(false)} placeholder="Enter User ID" value={loginUser}
              onChange={(e) => { setLoginUser(e.target.value); setLoginError(""); }} />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input type={showPass ? "text" : "password"}
                style={{ ...inp(false), paddingRight:44 }} placeholder="Enter Password"
                value={loginPass} onChange={(e) => { setLoginPass(e.target.value); setLoginError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                <IconEye show={showPass} />
              </button>
            </div>
          </div>

          {loginError && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#DC2626" }}>{loginError}</div>}

          <button onClick={handleLogin}
            style={{ width:"100%", padding:"15px", borderRadius:12, fontSize:16, fontWeight:700, background:"#1E293B", color:"#fff", border:"none", cursor:"pointer" }}>
            Login →
          </button>
          <button onClick={() => setScreen("complaint")}
            style={{ width:"100%", padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, background:"transparent", color:"#64748B", border:"none", cursor:"pointer", marginTop:8 }}>
            ← Back to Complaint Form
          </button>
        </div>
      </div>
    </div>
  );

  // ══ DASHBOARD ═══════════════════════════════════════════════════════════
  return (
    <div style={wrap}>
      {header("Complaints Dashboard",
        <button onClick={handleLogout}
          style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"6px 12px", color:"#CBD5E1", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          <IconLogout /> Logout
        </button>
      )}
      <div style={{ padding:"20px 16px 40px" }}>

        {dbError && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#DC2626" }}>{dbError}</div>}

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
          {[["Total", complaints.length, "#64748B"],["Pending", pendingCount, "#F59E0B"],["Completed", completedCount, "#10B981"]].map(([label,count,dot]) => (
            <div key={label} style={{ background:"#fff", borderRadius:14, padding:"14px 10px", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:dot, margin:"0 auto 8px" }} />
              <div style={{ fontSize:26, fontWeight:800, color:"#1E293B", lineHeight:1 }}>{count}</div>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:600, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Export */}
        <div style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Filter & Export</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
            {[
              { label:"Period", val:filterPeriod, set:setFilterPeriod, opts:[["all","All time"],["w0","This week"],["w1","Last week"],["w2","2 weeks ago"],["m0","This month"],["m1","Last month"],["m2","2 months ago"]] },
              { label:"Status", val:filterStatus, set:setFilterStatus, opts:[["all","All statuses"],["Pending","Pending"],["Completed","Completed"]] },
            ].map(({ label, val, set:setF, opts }) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:13, fontWeight:600, color:"#374151", minWidth:52 }}>{label}</span>
                <div style={{ flex:1, position:"relative" }}>
                  <select value={val} onChange={(e) => setF(e.target.value)}
                    style={{ width:"100%", padding:"9px 32px 9px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13, background:"#F8FAFC", color:"#1E293B", fontFamily:"inherit", WebkitAppearance:"none", boxSizing:"border-box", outline:"none" }}>
                    {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><IconChevron /></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid #F1F5F9", paddingTop:12 }}>
            <span style={{ fontSize:13, color:"#94A3B8" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={fetchComplaints} disabled={loading}
                style={{ padding:"9px 14px", borderRadius:9, background:"#F1F5F9", color:"#1E293B", fontWeight:600, fontSize:13, border:"none", cursor:"pointer" }}>
                {loading ? "…" : "↻ Refresh"}
              </button>
              <button onClick={exportReport}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:9, background:"#1E293B", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}>
                <IconDownload /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#94A3B8", fontSize:14 }}>Loading complaints…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"#94A3B8" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600 }}>No complaints found</div>
            <div style={{ fontSize:13, marginTop:6 }}>Adjust filters or wait for submissions</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map((c) => {
              const sc = STATUS_STYLES[c.status] || STATUS_STYLES["Pending"];
              const isOpen = expandedId === c.id;
              const pc = c.priority === "High" ? ["#FEF2F2","#DC2626"] : c.priority === "Medium" ? ["#FFFBEB","#D97706"] : ["#F0FDF4","#16A34A"];
              return (
                <div key={c.id} style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
                  <div onClick={() => setExpandedId(isOpen ? null : c.id)} style={{ padding:16, cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1, paddingRight:8 }}>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                          <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:700, background:sc.bg, color:sc.text }}>{c.status}</span>
                          <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:700, background:pc[0], color:pc[1] }}>{c.priority}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:15, color:"#1E293B", marginBottom:3 }}>{c.category}</div>
                        <div style={{ fontSize:13, color:"#475569" }}>{c.teacher_name} · {c.designation}</div>
                        <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>
                          {c.class_name} – Sec {c.section} · {formatDate(c.complaint_date)} · <strong>{c.id}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize:16, color:"#CBD5E1", transform:isOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop:"1px solid #F1F5F9", padding:"14px 16px 16px" }}>
                      <div style={{ fontSize:13, color:"#475569", lineHeight:1.65, marginBottom:16, background:"#F8FAFC", borderRadius:10, padding:12 }}>{c.description}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Update Status</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {["Pending","Completed"].map((s) => {
                          const ss = STATUS_STYLES[s];
                          const active = c.status === s;
                          return (
                            <button key={s} onClick={() => handleStatusChange(c.id, s)}
                              style={{ padding:"13px 0", borderRadius:10, fontSize:14, fontWeight:700,
                                border:`2px solid ${active ? ss.dot : "#E2E8F0"}`,
                                background: active ? ss.bg : "#F8FAFC",
                                color: active ? ss.text : "#94A3B8", cursor:"pointer" }}>
                              {active ? "✓ " : ""}{s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
