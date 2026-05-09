
import { useState, useEffect, useCallback } from "react";

// ── palette & fonts injected via style tag ──
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sora',sans-serif;background:#0b1f16;color:#e8f5ee;-webkit-tap-highlight-color:transparent;}
    ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#0b1f16;} ::-webkit-scrollbar-thumb{background:#1e6640;border-radius:4px;}
    input,select,textarea{font-family:'Sora',sans-serif;}
    input[type=checkbox]{accent-color:#00d97e;}
  `}</style>
);

// ── SEED DATA ──
const SEED = {
  settings: {
    groupName: "Grow Together Team",
    startMonth: "2026-02",
    // monthly contribution per month: { "2025-02": 100, "2025-03": 100, "2025-04": 100, "2025-05": 1000 }
    monthlyAmounts: {
    "2026-02": 100,
    "2026-03": 100,
    "2026-04": 100,
    "2026-05": 1000
  }, interestRate: 1,
    deadline: 10,
  },
  members: [
    { id: 1, name: "Veeranna", role: "admin",  pin: "1234", joined: "2026-02", phone: "", email: "" },
    { id: 2, name: "Anusha",   role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 3, name: "Krishna",  role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 4, name: "Santosh",  role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 5, name: "Channa",   role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 6, name: "Chandru",  role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 7, name: "Ashok",    role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
  ],
  // payments: { "memberId_YYYY-MM": amount }
  payments: {
  "1_2026-02": 100, "2_2026-02": 100, "3_2026-02": 100, "4_2026-02": 100,
  "5_2026-02": 100, "6_2026-02": 100, "7_2026-02": 100,

  "1_2026-03": 100, "2_2026-03": 100, "3_2026-03": 100, "4_2026-03": 100,
  "5_2026-03": 100, "6_2026-03": 100, "7_2026-03": 100,

  "1_2026-04": 100, "2_2026-04": 100, "3_2026-04": 100, "4_2026-04": 100,
  "5_2026-04": 100, "6_2026-04": 100, "7_2026-04": 100,
},
  loans: [],
  adjustments: [],
};

// ── UTILS ──
const nowYM = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0"); };
const fmt = n => "₹" + Number(n||0).toLocaleString("en-IN");
const monthLabel = ym => { if(!ym) return ""; const [y,m] = ym.split("-"); return new Date(y,m-1,1).toLocaleString("default",{month:"long",year:"numeric"}); };
const initials = name => name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
const nextId = arr => arr.length ? Math.max(...arr.map(x=>x.id)) + 1 : 1;
const USER_KEY = "gtt-current-user";

function getMonthsBetween(start, end) {
  const months = [];
  let [sy,sm] = start.split("-").map(Number);
  const [ey,em] = end.split("-").map(Number);
  while(sy < ey || (sy===ey && sm<=em)) {
    months.push(sy+"-"+String(sm).padStart(2,"0"));
    sm++; if(sm>12){sm=1;sy++;}
  }
  return months;
}

// ── MAIN APP ──
export default function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
 const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem(USER_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
});
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null); // { type, data }
  const [toast, setToast] = useState(null);

  // ── STORAGE ──
  const STORAGE_KEY = "gtt-main-data-v3";

  const loadData = useCallback(async () => {
    try {
      const result = localStorage.getItem(STORAGE_KEY);

if (result) {
  setDb(JSON.parse(result));
} else {
  setDb(SEED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
}
    } catch {
      // fallback to seed if storage fails
      setDb(SEED);
    }
    setLoading(false);
  }, []);

  const saveData = useCallback(async (newDb) => {
    setSaving(true);
    setDb(newDb);
    try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
    } catch { /* silent */ }
    setSaving(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg, color="#00d97e") => {
    setToast({msg, color});
    setTimeout(() => setToast(null), 2500);
  };

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:16,background:"#0b1f16"}}>
      <GlobalStyle/>
      <div style={{fontSize:52}}>🤝</div>
      <div style={{color:"#00d97e",fontWeight:800,fontSize:18}}>Loading GTT…</div>
    </div>
  );

  if (!user) return <LoginScreen db={db} onLogin={setUser} />;

  const isAdmin = user.role === "admin";

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"#0b1f16",display:"flex",flexDirection:"column"}}>
      <GlobalStyle/>
      {toast && (
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"white",padding:"10px 20px",borderRadius:12,zIndex:999,fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
          {toast.msg}
        </div>
      )}
      <TopBar user={user} saving={saving} onLogout={() => {
  localStorage.removeItem("gtt-current-user");
  setUser(null);
}} />
      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {tab==="home"    && <HomeScreen db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} openModal={(t,d)=>setModal({type:t,data:d})} />}
        {tab==="members" && <MembersScreen db={db} user={user} isAdmin={isAdmin} openModal={(t,d)=>setModal({type:t,data:d})} />}
        {tab==="loans"   && <LoansScreen db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} openModal={(t,d)=>setModal({type:t,data:d})} />}
        {tab==="reports" && <ReportsScreen db={db} />}
        {tab==="admin"   && isAdmin && <AdminScreen db={db} saveData={saveData} showToast={showToast} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} isAdmin={isAdmin} />
      {modal && (
        <ModalLayer modal={modal} db={db} user={user} isAdmin={isAdmin}
          saveData={saveData} showToast={showToast} onClose={()=>setModal(null)} />
      )}
    </div>
  );
}

// ── TOP BAR ──
function TopBar({user, saving, onLogout}) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div style={{background:"linear-gradient(135deg,#0b2e1c,#0f3d25)",padding:"14px 16px",borderBottom:"1px solid #1a5c35"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#00d97e",letterSpacing:-0.5}}>🤝 GTT</div>
          <div style={{fontSize:10,color:"#5aab7a",fontFamily:"JetBrains Mono",marginTop:1}}>Grow Together Team {saving?"· saving…":""}</div>
        </div>
        <div style={{position:"relative"}}>
          <div onClick={()=>setShowMenu(!showMenu)} style={{background:"#1a5c35",borderRadius:20,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12,fontWeight:700,color:"#e8f5ee"}}>{user.name.split(" ")[0]}</span>
            <span style={{fontSize:10,background:user.role==="admin"?"#f5a623":"#00d97e",color:"#0b1f16",padding:"2px 6px",borderRadius:4,fontWeight:800}}>{user.role.toUpperCase()}</span>
          </div>
          {showMenu && (
            <div style={{position:"absolute",right:0,top:40,background:"#0f3d25",border:"1px solid #1a5c35",borderRadius:10,padding:8,zIndex:100,minWidth:130}}>
              <div onClick={onLogout} style={{padding:"8px 12px",cursor:"pointer",color:"#ff6b6b",fontWeight:700,fontSize:13}}>🚪 Logout</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LOGIN ──
function LoginScreen({db, onLogin}) {
  const [sel, setSel] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const login = () => {
    const m = db.members.find(x=>x.id===parseInt(sel));
    if (!m || m.pin !== pin) { setErr("Wrong PIN. Try again."); return; }
    setErr("");
localStorage.setItem("gtt-current-user", JSON.stringify(m));
onLogin(m);
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#061510,#0f3d25)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"30px 24px"}}>
      <GlobalStyle/>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:64}}>🤝</div>
        <div style={{color:"#00d97e",fontSize:28,fontWeight:900,marginTop:8}}>Grow Together</div>
        <div style={{color:"#5aab7a",fontSize:13,marginTop:4}}>GTT – Financial Unity & Security</div>
      </div>
      <div style={{background:"#0f2e1c",borderRadius:20,padding:24,border:"1px solid #1a5c35"}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:18,color:"#e8f5ee"}}>Welcome 👋</div>
        <Label>Select Your Name</Label>
        <select value={sel} onChange={e=>setSel(e.target.value)} style={selectStyle}>
          <option value="">-- Choose --</option>
          {db.members.map(m=><option key={m.id} value={m.id}>{m.name} {m.role==="admin"?"(Admin)":""}</option>)}
        </select>
        <Label style={{marginTop:12}}>PIN (4 digits)</Label>
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)} maxLength={4} inputMode="numeric" placeholder="••••" style={inputStyle} onKeyDown={e=>e.key==="Enter"&&login()} />
        {err && <div style={{color:"#ff6b6b",fontSize:12,marginBottom:8,fontWeight:600}}>{err}</div>}
        <button onClick={login} style={btnStyle("#00d97e")}>Sign In →</button>
        {/* <div style={{fontSize:11,color:"#3d7a54",textAlign:"center",marginTop:10}}>Admin PIN: 1234 · Members PIN: 0000</div> */}
      </div>
    </div>
  );
}

// ── HOME ──
function HomeScreen({db, user, isAdmin, saveData, showToast, openModal}) {
  const ym = nowYM();
  const months = getMonthsBetween(db.settings.startMonth, ym);
  const eligible = db.members.filter(m=>m.joined<=ym);
  const paidThis = eligible.filter(m=>db.payments[`${m.id}_${ym}`]);
  const unpaidThis = eligible.filter(m=>!db.payments[`${m.id}_${ym}`]);
  const thisAmt = db.settings.monthlyAmounts[ym] || 0;
  const thisCollected = paidThis.length * thisAmt;
  const totalCollected = Object.entries(db.payments).reduce((s,[k,v])=>s+v,0);
  const onLoan = db.loans.filter(l=>l.status==="active").reduce((s,l)=>s+(l.amount-l.repaid),0);
  const available = totalCollected - onLoan;
  const myPaid = !!db.payments[`${user.id}_${ym}`];
  const pct = eligible.length ? (paidThis.length/eligible.length*100) : 0;

  return (
    <div style={{padding:"16px 14px"}}>
      {/* Fund summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <StatCard label="Total Fund" value={fmt(totalCollected)} icon="🏦" color="#00d97e" />
        <StatCard label="Available" value={fmt(available)} icon="✅" color="#5aab7a" />
        <StatCard label="This Month" value={fmt(thisCollected)} icon="📅" color="#f5a623" />
        <StatCard label="On Loan" value={fmt(onLoan)} icon="💸" color="#e07a5f" />
      </div>

      {/* My status */}
      <Card style={{marginBottom:12}}>
        <CardTitle>Your Status – {monthLabel(ym)}</CardTitle>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:36}}>{myPaid?"✅":"⚠️"}</div>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:myPaid?"#00d97e":"#f5a623"}}>{myPaid?"Paid":"Pending"}</div>
            <div style={{fontSize:12,color:"#5aab7a"}}>{myPaid?`Contribution recorded for ${monthLabel(ym)}`:`Please pay ${fmt(thisAmt)} by 10th`}</div>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <CardTitle style={{margin:0}}>This Month Collection</CardTitle>
          <span style={{fontSize:12,fontWeight:700,color:"#5aab7a"}}>{paidThis.length}/{eligible.length} paid</span>
        </div>
        <div style={{fontSize:24,fontWeight:900,fontFamily:"JetBrains Mono",color:"#00d97e",marginBottom:8}}>{fmt(thisCollected)}</div>
        <div style={{height:8,background:"#1a3d28",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#00d97e,#5aab7a)",width:`${pct}%`,transition:"width 0.6s",borderRadius:4}}/>
        </div>
        <div style={{marginTop:12}}>
          {eligible.map(m=>{
            const p = !!db.payments[`${m.id}_${ym}`];
            return (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1a3d28"}}>
                <Avatar name={m.name} size={34} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700}}>{m.name}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:p?"#0d3320":"#3d1010",color:p?"#00d97e":"#ff6b6b"}}>{p?"✓ Paid":"Pending"}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {isAdmin && (
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <button onClick={()=>openModal("payment",null)} style={{...btnStyle("#00d97e"),flex:1,margin:0,padding:"12px 8px",fontSize:13}}>+ Record Payment</button>
          <button onClick={()=>openModal("loan",null)} style={{...btnStyle("#f5a623"),flex:1,margin:0,padding:"12px 8px",fontSize:13}}>+ Add Loan</button>
        </div>
      )}

      {/* Month history preview */}
      <Card>
        <CardTitle>Payment History by Month</CardTitle>
        {months.slice().reverse().map(mo=>{
          const mAmt = db.settings.monthlyAmounts[mo] || 0;
          const mEligible = db.members.filter(m=>m.joined<=mo);
          const mPaid = mEligible.filter(m=>db.payments[`${m.id}_${mo}`]).length;
          const mTotal = mPaid * mAmt;
          return (
            <div key={mo} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #1a3d28"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700}}>{monthLabel(mo)}</div>
                <div style={{fontSize:11,color:"#5aab7a"}}>{mPaid}/{mEligible.length} paid · {fmt(mAmt)}/member</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:900,fontFamily:"JetBrains Mono",color:"#00d97e"}}>{fmt(mTotal)}</div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── MEMBERS ──
function MembersScreen({db, user, isAdmin, openModal}) {
  return (
    <div style={{padding:"16px 14px"}}>
      {isAdmin && (
        <button onClick={()=>openModal("addMember",null)} style={{...btnStyle("#00d97e"),marginBottom:14}}>+ Add Member</button>
      )}
      <SectionTitle>All Members ({db.members.length})</SectionTitle>
      {db.members.map(m=>{
        const total = Object.entries(db.payments).filter(([k])=>k.startsWith(`${m.id}_`)).reduce((s,[,v])=>s+v,0);
        const activeLoans = db.loans.filter(l=>l.memberId===m.id&&l.status==="active").length;
        return (
          <Card key={m.id} onClick={()=>openModal("memberDetail",m)} style={{cursor:"pointer",marginBottom:10}}>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <Avatar name={m.name} size={44}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontWeight:800,fontSize:15}}>{m.name}</span>
                  <span style={{fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4,background:m.role==="admin"?"#f5a62330":"#00d97e20",color:m.role==="admin"?"#f5a623":"#00d97e"}}>{m.role.toUpperCase()}</span>
                </div>
                <div style={{fontSize:11,color:"#5aab7a"}}>Joined {monthLabel(m.joined)}</div>
                <div style={{fontSize:11,color:"#5aab7a",marginTop:2}}>Total paid: <b style={{color:"#00d97e"}}>{fmt(total)}</b> · Loans: {activeLoans}</div>
              </div>
              <span style={{color:"#3d7a54",fontSize:20}}>›</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── LOANS ──
function LoansScreen({db, user, isAdmin, saveData, showToast, openModal}) {
  const [loanTab, setLoanTab] = useState("active");
  const filtered = db.loans.filter(l=>l.status===loanTab);
  const tabColor = {active:"#00d97e",pending:"#f5a623",closed:"#5aab7a"};
  return (
    <div style={{padding:"16px 14px"}}>
      <div style={{display:"flex",background:"#0f2e1c",borderRadius:10,padding:3,marginBottom:14,gap:3}}>
        {["active","pending","closed"].map(t=>(
          <div key={t} onClick={()=>setLoanTab(t)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,cursor:"pointer",fontWeight:800,fontSize:12,background:loanTab===t?"#1a5c35":"transparent",color:loanTab===t?tabColor[t]:"#5aab7a",transition:"all 0.2s"}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </div>
        ))}
      </div>
      {!filtered.length && <div style={{textAlign:"center",color:"#3d7a54",padding:30,fontWeight:600}}>No {loanTab} loans.</div>}
      {filtered.map(l=>{
        const m = db.members.find(x=>x.id===l.memberId);
        const out = l.amount - l.repaid;
        return (
          <Card key={l.id} onClick={()=>openModal("loanDetail",l)} style={{cursor:"pointer",marginBottom:10,borderLeft:`4px solid ${l.status==="pending"?"#f5a623":l.status==="closed"?"#3d7a54":"#00d97e"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:800,fontSize:15,marginBottom:3}}>{m?.name}</div>
                <div style={{fontSize:11,color:"#5aab7a"}}>{l.type==="emergency"?"🏥 Emergency (No Interest)":"💼 Personal (1%/mo)"}</div>
                <div style={{fontSize:11,color:"#5aab7a",marginTop:2}}>Due: {monthLabel(l.repayDate)} · Outstanding: {fmt(out)}</div>
                <div style={{fontSize:11,color:"#3d7a54",marginTop:2}}>{l.reason}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:900,fontFamily:"JetBrains Mono",color:"#00d97e"}}>{fmt(l.amount)}</div>
              </div>
            </div>
          </Card>
        );
      })}
      {isAdmin && (
        <button onClick={()=>openModal("loan",null)} style={{...btnStyle("#f5a623"),marginTop:8}}>+ Add Loan</button>
      )}
    </div>
  );
}

// ── REPORTS ──
function ReportsScreen({db}) {
  const [rt, setRt] = useState("monthly");
  const ym = nowYM();
  const months = getMonthsBetween(db.settings.startMonth, ym);
  const totalCollected = Object.entries(db.payments).reduce((s,[,v])=>s+v,0);
  const onLoan = db.loans.filter(l=>l.status==="active").reduce((s,l)=>s+(l.amount-l.repaid),0);
  const available = totalCollected - onLoan;
  const eligible = db.members.filter(m=>m.joined<=ym);
  const paidThis = eligible.filter(m=>db.payments[`${m.id}_${ym}`]);
  const unpaidThis = eligible.filter(m=>!db.payments[`${m.id}_${ym}`]);
  const thisAmt = db.settings.monthlyAmounts[ym]||0;

  // WhatsApp message
  const waMsg = `🤝 *GROW TOGETHER TEAM (GTT)*\n${"━".repeat(22)}\n📅 *${monthLabel(ym)} Report*\n\n💰 *This Month:* ${fmt(paidThis.length*thisAmt)}\n🏦 *Total Collected:* ${fmt(totalCollected)}\n📤 *On Loan:* ${fmt(onLoan)}\n✅ *Available Balance:* ${fmt(available)}\n\n👥 *Paid (${paidThis.length}):* ${paidThis.map(m=>m.name).join(", ")||"—"}\n⚠️ *Pending (${unpaidThis.length}):* ${unpaidThis.map(m=>m.name).join(", ")||"All Clear! 🎉"}\n${db.loans.filter(l=>l.status==="active").length?`\n📋 *Active Loans:*\n${db.loans.filter(l=>l.status==="active").map(l=>`  • ${db.members.find(m=>m.id===l.memberId)?.name}: ${fmt(l.amount-l.repaid)}`).join("\n")}\n`:""}\n${"━".repeat(22)}\n_No member should struggle alone._\n_We grow together_ 🌱`;

  const last6 = months.slice(-6);

  return (
    <div style={{padding:"16px 14px"}}>
      <div style={{display:"flex",background:"#0f2e1c",borderRadius:10,padding:3,marginBottom:14,gap:3}}>
        {["monthly","6month","share"].map(t=>(
          <div key={t} onClick={()=>setRt(t)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,cursor:"pointer",fontWeight:800,fontSize:11,background:rt===t?"#1a5c35":"transparent",color:rt===t?"#00d97e":"#5aab7a"}}>
            {t==="monthly"?"Monthly":t==="6month"?"6-Month":"Share 📤"}
          </div>
        ))}
      </div>

      {rt==="monthly" && (
        <>
          <Card style={{marginBottom:12}}>
            <CardTitle>📅 {monthLabel(ym)}</CardTitle>
            <ReportRow label="This Month Amount" value={fmt(paidThis.length*thisAmt)} color="#00d97e"/>
            <ReportRow label="Rate This Month" value={fmt(thisAmt)+"/member"}/>
            <ReportRow label="Total Fund (All Time)" value={fmt(totalCollected)}/>
            <ReportRow label="On Loan" value={fmt(onLoan)} color="#f5a623"/>
            <ReportRow label="Available Balance" value={fmt(available)} color="#00d97e"/>
            <ReportRow label={`Paid (${paidThis.length})`} value={paidThis.map(m=>m.name).join(", ")||"—"} color="#00d97e"/>
            <ReportRow label={`Pending (${unpaidThis.length})`} value={unpaidThis.map(m=>m.name).join(", ")||"All paid 🎉"} color={unpaidThis.length?"#ff6b6b":"#00d97e"}/>
          </Card>
          <Card>
            <CardTitle>Member Contributions (All Time)</CardTitle>
            {db.members.map(m=>{
              const tot = Object.entries(db.payments).filter(([k])=>k.startsWith(`${m.id}_`)).reduce((s,[,v])=>s+v,0);
              return <ReportRow key={m.id} label={m.name} value={fmt(tot)} color="#00d97e"/>;
            })}
          </Card>
        </>
      )}

      {rt==="6month" && (
        <>
          <Card style={{marginBottom:12}}>
            <CardTitle>📊 6-Month Summary</CardTitle>
            {last6.map(mo=>{
              const mAmt = db.settings.monthlyAmounts[mo]||0;
              const mEl = db.members.filter(m=>m.joined<=mo);
              const mPaid = mEl.filter(m=>db.payments[`${m.id}_${mo}`]).length;
              return (
                <div key={mo} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #1a3d28"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700}}>{monthLabel(mo)}</div>
                    <div style={{fontSize:11,color:"#5aab7a"}}>{mPaid}/{mEl.length} · {fmt(mAmt)}/member</div>
                  </div>
                  <div style={{fontFamily:"JetBrains Mono",fontWeight:700,color:"#00d97e"}}>{fmt(mPaid*mAmt)}</div>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0",borderTop:"2px solid #00d97e",marginTop:4}}>
              <span style={{fontWeight:900}}>6-Month Total</span>
              <span style={{fontFamily:"JetBrains Mono",fontWeight:900,color:"#00d97e"}}>{fmt(last6.reduce((s,mo)=>{const mAmt=db.settings.monthlyAmounts[mo]||0;const mEl=db.members.filter(m=>m.joined<=mo);return s+mEl.filter(m=>db.payments[`${m.id}_${mo}`]).length*mAmt;},0))}</span>
            </div>
          </Card>
          <Card>
            <CardTitle>Member-wise (Last 6 Months)</CardTitle>
            {db.members.map(m=>{
              const tot = last6.reduce((s,mo)=>{const v=db.payments[`${m.id}_${mo}`];return s+(v||0);},0);
              const cnt = last6.filter(mo=>db.payments[`${m.id}_${mo}`]).length;
              return <ReportRow key={m.id} label={m.name} value={`${fmt(tot)} (${cnt}/6)`} color="#00d97e"/>;
            })}
          </Card>
        </>
      )}

      {rt==="share" && (
        <Card>
          <CardTitle>📲 Share Report</CardTitle>
          <div style={{background:"#0b2e1c",borderRadius:10,padding:14,fontSize:12,fontFamily:"JetBrains Mono",lineHeight:1.7,color:"#a8d8c4",whiteSpace:"pre-wrap",marginBottom:12,border:"1px solid #1a5c35"}}>
            {waMsg}
          </div>
          <button onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent(waMsg),"_blank")} style={{...btnStyle("#25d366"),marginBottom:8}}>📤 Share on WhatsApp</button>
          <button onClick={()=>navigator.clipboard.writeText(waMsg).then(()=>alert("Copied!"))} style={btnStyle("#1a5c35")}>📋 Copy Text</button>
        </Card>
      )}
    </div>
  );
}

// ── ADMIN ──
function AdminScreen({db, saveData, showToast}) {
  const [adminTab, setAdminTab] = useState("payments");
  const ym = nowYM();
  const [selMonth, setSelMonth] = useState(ym);
  const [contrib, setContrib] = useState(db.settings.contribution||1000);
  const [monthAmt, setMonthAmt] = useState(db.settings.monthlyAmounts[selMonth]||1000);

  useEffect(()=>{
    setMonthAmt(db.settings.monthlyAmounts[selMonth]||1000);
  },[selMonth,db]);

  const eligible = db.members.filter(m=>m.joined<=selMonth);

  const togglePayment = (memberId) => {
    const key = `${memberId}_${selMonth}`;
    const newDb = {...db, payments:{...db.payments}};
    if (newDb.payments[key]) delete newDb.payments[key];
    else newDb.payments[key] = monthAmt;
    saveData(newDb);
  };

  const saveMonthAmount = () => {
    const newDb = {...db, settings:{...db.settings, monthlyAmounts:{...db.settings.monthlyAmounts,[selMonth]:parseFloat(monthAmt)||0}}};
    saveData(newDb);
    showToast(`Rate for ${monthLabel(selMonth)} set to ${fmt(monthAmt)}`);
  };

  const [adjType,setAdjType] = useState("credit");
  const [adjAmt,setAdjAmt] = useState("");
  const [adjReason,setAdjReason] = useState("");
  const addAdj = () => {
    if(!adjAmt||!adjReason){showToast("Fill all fields","#e07a5f");return;}
    const newDb={...db,adjustments:[...db.adjustments,{id:Date.now(),type:adjType,amount:parseFloat(adjAmt),reason:adjReason,date:ym}]};
    saveData(newDb); setAdjAmt(""); setAdjReason(""); showToast("Adjustment saved!");
  };

  return (
    <div style={{padding:"16px 14px"}}>
      <div style={{fontSize:16,fontWeight:900,marginBottom:14,color:"#00d97e"}}>⚙️ Admin Panel</div>
      <div style={{display:"flex",background:"#0f2e1c",borderRadius:10,padding:3,marginBottom:14,gap:3}}>
        {["payments","settings","adjust"].map(t=>(
          <div key={t} onClick={()=>setAdminTab(t)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,cursor:"pointer",fontWeight:800,fontSize:11,background:adminTab===t?"#1a5c35":"transparent",color:adminTab===t?"#00d97e":"#5aab7a"}}>
            {t==="payments"?"Payments":t==="settings"?"Settings":"Adjust"}
          </div>
        ))}
      </div>

      {adminTab==="payments" && (
        <Card>
          <CardTitle>Mark Payments</CardTitle>
          <Label>Select Month</Label>
          <input type="month" value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{...inputStyle,marginBottom:8}}/>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:14}}>
            <div style={{flex:1}}>
              <Label>Amount for this month (₹)</Label>
              <input type="number" value={monthAmt} onChange={e=>setMonthAmt(e.target.value)} style={inputStyle}/>
            </div>
            <button onClick={saveMonthAmount} style={{...btnStyle("#00d97e"),margin:0,padding:"10px 14px",fontSize:12,whiteSpace:"nowrap"}}>Set Rate</button>
          </div>
          <div style={{fontSize:11,color:"#5aab7a",marginBottom:10}}>Toggle to mark paid/unpaid. Amount: {fmt(monthAmt)}/member</div>
          {eligible.map(m=>{
            const paid = !!db.payments[`${m.id}_${selMonth}`];
            return (
              <div key={m.id} onClick={()=>togglePayment(m.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #1a3d28",cursor:"pointer"}}>
                <Avatar name={m.name} size={36}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                  <div style={{fontSize:11,color:paid?"#00d97e":"#ff6b6b"}}>{paid?`Paid ${fmt(monthAmt)}`:"Unpaid"}</div>
                </div>
                <div style={{width:28,height:28,borderRadius:14,border:`2px solid ${paid?"#00d97e":"#3d7a54"}`,background:paid?"#00d97e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{paid?"✓":""}</div>
              </div>
            );
          })}
        </Card>
      )}

      {adminTab==="settings" && (
        <Card>
          <CardTitle>Monthly Rate History</CardTitle>
          <div style={{fontSize:11,color:"#5aab7a",marginBottom:10}}>Set the contribution amount per month. Each month can have a different rate.</div>
          {Object.entries(db.settings.monthlyAmounts).sort().map(([mo,amt])=>(
            <ReportRow key={mo} label={monthLabel(mo)} value={fmt(amt)}/>
          ))}
          <div style={{marginTop:12,borderTop:"1px solid #1a3d28",paddingTop:12}}>
            <div style={{fontSize:12,color:"#5aab7a",marginBottom:8}}>To add a new month rate, go to Payments tab and set the amount for that month.</div>
          </div>
        </Card>
      )}

      {adminTab==="adjust" && (
        <Card>
          <CardTitle>Fund Adjustments</CardTitle>
          <Label>Type</Label>
          <select value={adjType} onChange={e=>setAdjType(e.target.value)} style={{...selectStyle,marginBottom:10}}>
            <option value="credit">Credit (Add funds)</option>
            <option value="debit">Debit (Deduct)</option>
          </select>
          <Label>Amount (₹)</Label>
          <input type="number" value={adjAmt} onChange={e=>setAdjAmt(e.target.value)} placeholder="0" style={{...inputStyle,marginBottom:10}}/>
          <Label>Reason</Label>
          <input type="text" value={adjReason} onChange={e=>setAdjReason(e.target.value)} placeholder="Interest earned, expense..." style={{...inputStyle,marginBottom:12}}/>
          <button onClick={addAdj} style={btnStyle("#00d97e")}>Save Adjustment</button>
          {db.adjustments.length>0 && (
            <div style={{marginTop:14}}>
              <CardTitle>Adjustment History</CardTitle>
              {db.adjustments.map(a=>(
                <ReportRow key={a.id} label={a.reason+" ("+monthLabel(a.date)+")"} value={(a.type==="credit"?"+":"-")+fmt(a.amount)} color={a.type==="credit"?"#00d97e":"#e07a5f"}/>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── MODAL LAYER ──
function ModalLayer({modal, db, user, isAdmin, saveData, showToast, onClose}) {
  const {type, data} = modal;
  const [form, setForm] = useState({
    memberId: db.members[0]?.id||"",
    month: nowYM(),
    amount: db.settings.monthlyAmounts[nowYM()]||1000,
    note:"",
    loanType:"emergency",
    loanAmount:"",
    reason:"",
    repayDate:"",
    loanStatus: isAdmin?"active":"pending",
    // member form
    name:"", phone:"", email:"", role:"member", pin:"", joined: nowYM(),
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
const [repayAmt, setRepayAmt] = useState("");
  const savePayment = () => {
    const key = `${form.memberId}_${form.month}`;
    if(db.payments[key]){showToast("Already recorded for this month","#f5a623");return;}
    const newDb={...db, payments:{...db.payments,[key]:parseFloat(form.amount)||0}};
    saveData(newDb); showToast("Payment recorded! ✅"); onClose();
  };

  const saveLoan = () => {
    if(!form.loanAmount||!form.reason||!form.repayDate){showToast("Fill all fields","#e07a5f");return;}
    const loan={id:Date.now(),memberId:parseInt(form.memberId),type:form.loanType,amount:parseFloat(form.loanAmount),reason:form.reason,repayDate:form.repayDate,status:form.loanStatus,date:nowYM(),repaid:0};
    const newDb={...db,loans:[...db.loans,loan]};
    saveData(newDb); showToast("Loan added!"); onClose();
  };

  const saveMember = () => {
    if(!form.name||!form.pin||!form.joined){showToast("Fill required fields","#e07a5f");return;}
    if(form.pin.length!==4){showToast("PIN must be 4 digits","#e07a5f");return;}
    const newMember={id:nextId(db.members),name:form.name,phone:form.phone,email:form.email,role:form.role,pin:form.pin,joined:form.joined};
    saveData({...db,members:[...db.members,newMember]}); showToast("Member added! ✅"); onClose();
  };

  const doRepay = (loanId, amt) => {
    const loans = db.loans.map(l=>{
      if(l.id!==loanId) return l;
      const repaid = l.repaid + parseFloat(amt||0);
      return {...l, repaid, status: repaid>=l.amount?"closed":l.status};
    });
    saveData({...db,loans}); showToast("Repayment recorded!"); onClose();
  };

  const approveLoan = (loanId) => {
    const loans = db.loans.map(l=>l.id===loanId?{...l,status:"active"}:l);
    saveData({...db,loans}); showToast("Loan approved!"); onClose();
  };

  const closeLoan = (loanId) => {
    const loans = db.loans.map(l=>l.id===loanId?{...l,status:"closed"}:l);
    saveData({...db,loans}); showToast("Loan closed!"); onClose();
  };

  const removeMember = (id) => {
    if(!window.confirm("Remove member?")) return;
    saveData({...db,members:db.members.filter(m=>m.id!==id)}); showToast("Member removed"); onClose();
  };
 
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#0f2e1c",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:20,maxHeight:"90vh",overflowY:"auto",border:"1px solid #1a5c35"}}>

        {type==="payment" && (
          <>
            <ModalTitle onClose={onClose}>Record Payment</ModalTitle>
            <Label>Member</Label>
            <select value={form.memberId} onChange={e=>set("memberId",e.target.value)} style={selectStyle}>
              {db.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <Label style={{marginTop:12}}>Month</Label>
            <input type="month" value={form.month} onChange={e=>set("month",e.target.value)} style={inputStyle}/>
            <Label style={{marginTop:12}}>Amount (₹)</Label>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} style={inputStyle}/>
            <Label style={{marginTop:12}}>Note</Label>
            <input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Cash, UPI..." style={inputStyle}/>
            <button onClick={savePayment} style={{...btnStyle("#00d97e"),marginTop:14}}>Record Payment</button>
          </>
        )}

        {type==="loan" && (
          <>
            <ModalTitle onClose={onClose}>Add Loan</ModalTitle>
            <Label>Member</Label>
            <select value={form.memberId} onChange={e=>set("memberId",e.target.value)} style={selectStyle}>{db.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <Label style={{marginTop:12}}>Loan Type</Label>
            <select value={form.loanType} onChange={e=>set("loanType",e.target.value)} style={selectStyle}>
              <option value="emergency">🏥 Health Emergency (No Interest)</option>
              <option value="personal">💼 Personal (1%/month interest)</option>
            </select>
            <Label style={{marginTop:12}}>Amount (₹)</Label>
            <input type="number" value={form.loanAmount} onChange={e=>set("loanAmount",e.target.value)} placeholder="0" style={inputStyle}/>
            <Label style={{marginTop:12}}>Reason</Label>
            <textarea value={form.reason} onChange={e=>set("reason",e.target.value)} placeholder="Explain the need..." style={{...inputStyle,minHeight:80,resize:"vertical"}}/>
            <Label style={{marginTop:12}}>Repayment Month</Label>
            <input type="month" value={form.repayDate} onChange={e=>set("repayDate",e.target.value)} style={inputStyle}/>
            {isAdmin && (<><Label style={{marginTop:12}}>Status</Label><select value={form.loanStatus} onChange={e=>set("loanStatus",e.target.value)} style={selectStyle}><option value="pending">Pending Approval</option><option value="active">Approved & Active</option></select></>)}
            <button onClick={saveLoan} style={{...btnStyle("#f5a623"),marginTop:14}}>Submit Loan</button>
          </>
        )}

        {type==="addMember" && (
          <>
            <ModalTitle onClose={onClose}>Add New Member</ModalTitle>
            <Label>Full Name *</Label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Name" style={inputStyle}/>
            <Label style={{marginTop:12}}>Phone</Label><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91..." style={inputStyle}/>
            <Label style={{marginTop:12}}>Role</Label>
            <select value={form.role} onChange={e=>set("role",e.target.value)} style={selectStyle}><option value="member">Member</option><option value="admin">Admin</option></select>
            <Label style={{marginTop:12}}>PIN (4 digits) *</Label><input type="password" value={form.pin} onChange={e=>set("pin",e.target.value)} maxLength={4} inputMode="numeric" placeholder="••••" style={inputStyle}/>
            <Label style={{marginTop:12}}>Joined Month *</Label><input type="month" value={form.joined} onChange={e=>set("joined",e.target.value)} style={inputStyle}/>
            <button onClick={saveMember} style={{...btnStyle("#00d97e"),marginTop:14}}>Add Member</button>
          </>
        )}

        {type==="memberDetail" && data && (() => {
          const m = data;
          const payments = Object.entries(db.payments).filter(([k])=>k.startsWith(`${m.id}_`));
          const total = payments.reduce((s,[,v])=>s+v,0);
          const loans = db.loans.filter(l=>l.memberId===m.id);
          return <>
            <ModalTitle onClose={onClose}>{m.name}</ModalTitle>
            <Card style={{marginBottom:10}}>
              <ReportRow label="Role" value={m.role.toUpperCase()}/>
              <ReportRow label="Joined" value={monthLabel(m.joined)}/>
              {m.phone && <ReportRow label="Phone" value={m.phone}/>}
              <ReportRow label="Total Contributed" value={fmt(total)} color="#00d97e"/>
            </Card>
            <div style={{fontSize:14,fontWeight:800,marginBottom:8}}>Payment History</div>
            {payments.length===0 && <div style={{color:"#3d7a54",fontSize:13,marginBottom:12}}>No payments yet.</div>}
            {payments.sort((a,b)=>b[0].localeCompare(a[0])).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1a3d28"}}>
                <span style={{fontSize:13}}>{monthLabel(k.split("_")[1])}</span>
                <span style={{fontFamily:"JetBrains Mono",fontWeight:700,color:"#00d97e"}}>{fmt(v)}</span>
              </div>
            ))}
            {loans.length>0 && (<>
              <div style={{fontSize:14,fontWeight:800,margin:"14px 0 8px"}}>Loans</div>
              {loans.map(l=>(
                <div key={l.id} style={{background:"#1a3d28",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:700}}>{l.type==="emergency"?"🏥":"💼"} {fmt(l.amount)}</span>
                    <span style={{fontSize:11,background:"#0f2e1c",padding:"2px 8px",borderRadius:4}}>{l.status}</span>
                  </div>
                  <div style={{fontSize:11,color:"#5aab7a",marginTop:4}}>{l.reason}</div>
                </div>
              ))}
            </>)}
            {isAdmin && <button onClick={()=>removeMember(m.id)} style={{...btnStyle("#3d1010"),color:"#ff6b6b",marginTop:10,border:"1px solid #ff6b6b"}}>Remove Member</button>}
          </>;
        })()}

        {type==="loanDetail" && data && (() => {
          const l = data;
          const m = db.members.find(x=>x.id===l.memberId);
          const out = l.amount - l.repaid;
         
          return <>
            <ModalTitle onClose={onClose}>Loan – {m?.name}</ModalTitle>
            <Card style={{marginBottom:10}}>
              <ReportRow label="Type" value={l.type==="emergency"?"🏥 Emergency (No Interest)":"💼 Personal (1%/mo)"}/>
              <ReportRow label="Amount" value={fmt(l.amount)}/>
              <ReportRow label="Repaid" value={fmt(l.repaid)} color="#00d97e"/>
              <ReportRow label="Outstanding" value={fmt(out)} color={out>0?"#ff6b6b":"#00d97e"}/>
              <ReportRow label="Due Date" value={monthLabel(l.repayDate)}/>
              <ReportRow label="Status" value={l.status.toUpperCase()}/>
              <ReportRow label="Reason" value={l.reason}/>
            </Card>
            {isAdmin && l.status!=="closed" && (
              <Card>
                <CardTitle>Record Repayment</CardTitle>
                <input type="number" value={repayAmt} onChange={e=>setRepayAmt(e.target.value)} placeholder={`Max ${fmt(out)}`} style={inputStyle}/>
                <button onClick={()=>doRepay(l.id,repayAmt)} style={{...btnStyle("#00d97e"),marginTop:10}}>Mark Repaid</button>
                {l.status==="pending" && <button onClick={()=>approveLoan(l.id)} style={{...btnStyle("#f5a623"),marginTop:8}}>✓ Approve Loan</button>}
                <button onClick={()=>closeLoan(l.id)} style={{...btnStyle("#3d1010"),color:"#ff6b6b",marginTop:8,border:"1px solid #ff6b6b"}}>Close Loan</button>
              </Card>
            )}
          </>;
        })()}

      </div>
    </div>
  );
}

// ── BOTTOM NAV ──
function BottomNav({tab, setTab, isAdmin}) {
  const items = [
    {id:"home",icon:"🏠",label:"Home"},
    {id:"members",icon:"👥",label:"Members"},
    {id:"loans",icon:"💸",label:"Loans"},
    {id:"reports",icon:"📊",label:"Reports"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Admin"}]:[]),
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#0b2e1c",borderTop:"1px solid #1a5c35",display:"flex",zIndex:100}}>
      {items.map(it=>(
        <div key={it.id} onClick={()=>setTab(it.id)} style={{flex:1,padding:"10px 4px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",borderTop:`3px solid ${tab===it.id?"#00d97e":"transparent"}`,transition:"all 0.2s"}}>
          <span style={{fontSize:18}}>{it.icon}</span>
          <span style={{fontSize:9,fontWeight:800,color:tab===it.id?"#00d97e":"#3d7a54"}}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── SHARED COMPONENTS ──
const Avatar = ({name,size=40}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#00d97e,#1a5c35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:900,color:"white",flexShrink:0}}>
    {initials(name)}
  </div>
);
const Card = ({children,style,onClick}) => (
  <div onClick={onClick} style={{background:"#0f2e1c",borderRadius:14,padding:14,border:"1px solid #1a5c35",boxShadow:"0 2px 12px rgba(0,0,0,0.2)",...style}}>
    {children}
  </div>
);
const CardTitle = ({children,style}) => <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:0.8,color:"#5aab7a",marginBottom:10,...style}}>{children}</div>;
const SectionTitle = ({children}) => <div style={{fontSize:15,fontWeight:900,marginBottom:10,color:"#e8f5ee"}}>{children}</div>;
const Label = ({children,style}) => <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:0.5,color:"#5aab7a",marginBottom:4,...style}}>{children}</div>;
const ReportRow = ({label,value,color}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid #1a3d28"}}>
    <span style={{fontSize:12,color:"#5aab7a",fontWeight:600,flex:1}}>{label}</span>
    <span style={{fontSize:13,fontWeight:800,fontFamily:"JetBrains Mono",color:color||"#e8f5ee",textAlign:"right",marginLeft:10}}>{value}</span>
  </div>
);
const StatCard = ({label,value,icon,color}) => (
  <div style={{background:"#0f2e1c",borderRadius:12,padding:12,border:"1px solid #1a5c35",textAlign:"center"}}>
    <div style={{fontSize:22}}>{icon}</div>
    <div style={{fontSize:16,fontWeight:900,fontFamily:"JetBrains Mono",color:color||"#e8f5ee",marginTop:4}}>{value}</div>
    <div style={{fontSize:10,color:"#5aab7a",fontWeight:700,marginTop:2}}>{label}</div>
  </div>
);
const ModalTitle = ({children,onClose}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <div style={{fontSize:17,fontWeight:900,color:"#e8f5ee"}}>{children}</div>
    <div onClick={onClose} style={{fontSize:22,cursor:"pointer",color:"#5aab7a",lineHeight:1}}>✕</div>
  </div>
);

const inputStyle = {width:"100%",padding:"11px 12px",background:"#1a3d28",border:"1.5px solid #1a5c35",borderRadius:10,color:"#e8f5ee",fontSize:14,outline:"none",display:"block",marginBottom:0};
const selectStyle = {width:"100%",padding:"11px 12px",background:"#1a3d28",border:"1.5px solid #1a5c35",borderRadius:10,color:"#e8f5ee",fontSize:14,outline:"none",display:"block"};
const btnStyle = (bg) => ({width:"100%",padding:"13px",border:"none",borderRadius:12,fontFamily:"Sora,sans-serif",fontSize:14,fontWeight:800,cursor:"pointer",background:bg,color:bg==="#1a5c35"||bg==="#3d1010"?"#e8f5ee":"#0b1f16",display:"block"});
