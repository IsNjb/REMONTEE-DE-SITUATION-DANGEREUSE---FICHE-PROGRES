const loginCard = document.querySelector("#loginCard");
const dashboard = document.querySelector("#dashboard");
const dialog = document.querySelector("#reportDialog");
let reports = [];

function toast(message) {
  const node = document.querySelector("#toast"); node.textContent = message; node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 3000);
}
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
document.querySelector("#loginForm").addEventListener("submit", event => {
  event.preventDefault();
  if (document.querySelector("#adminCode").value !== APP_CONFIG.adminCode) return toast("Code incorrect.");
  sessionStorage.setItem("qse_admin", "1"); showDashboard();
});
document.querySelector("#logout").onclick = () => { sessionStorage.removeItem("qse_admin"); location.reload(); };
if (sessionStorage.getItem("qse_admin")) showDashboard();

async function showDashboard() {
  loginCard.hidden = true; dashboard.hidden = false;
  await loadReports(); render();
}
async function loadReports() {
  if (APP_CONFIG.mode === "supabase") {
    const headers = {"apikey": APP_CONFIG.supabaseAnonKey, "Authorization": `Bearer ${APP_CONFIG.supabaseAnonKey}`};
    const response = await fetch(`${APP_CONFIG.supabaseUrl}/rest/v1/reports?select=*&order=created_at.desc`, {headers});
    if (!response.ok) return toast("Impossible de charger les remontées.");
    reports = await response.json();
  } else reports = JSON.parse(localStorage.getItem("qse_reports") || "[]");
}
function filtered() {
  const q = document.querySelector("#searchFilter").value.toLowerCase();
  const company = document.querySelector("#companyFilter").value;
  const priority = document.querySelector("#priorityFilter").value;
  return reports.filter(r => {
    const haystack = [r.reference,r.reporter_name,r.client_name,r.site_name,r.what].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) && (!company || r.company === company) && (!priority || String(r.priority) === priority);
  });
}
function render() {
  document.querySelector("#statTotal").textContent = reports.length;
  document.querySelector("#statNew").textContent = reports.filter(r => r.status === "Nouvelle").length;
  document.querySelector("#statP1").textContent = reports.filter(r => r.priority === 1).length;
  document.querySelector("#statOpen").textContent = reports.filter(r => r.status !== "Clôturée").length;
  const list = document.querySelector("#reportsList"), rows = filtered(); list.innerHTML = "";
  document.querySelector("#emptyState").hidden = rows.length > 0;
  rows.forEach(r => {
    const article = document.createElement("article"); article.className = "report-card card";
    article.innerHTML = `
      <div class="report-top"><span class="badge priority-${r.priority}">Priorité ${r.priority}</span><span class="status">${escapeHtml(r.status)}</span></div>
      <h2>${escapeHtml(r.event_type)}</h2><p class="report-ref">${escapeHtml(r.reference || r.id)}</p>
      <p>${escapeHtml(r.what)}</p>
      <div class="report-meta"><span>🏢 ${escapeHtml(r.company)} · ${escapeHtml(r.client_name)}</span><span>📍 ${escapeHtml(r.site_name)}</span><span>📅 ${new Date(r.created_at).toLocaleDateString("fr-FR")}</span></div>
      <button class="secondary detail-button">Consulter</button>`;
    article.querySelector("button").onclick = () => openReport(r);
    list.append(article);
  });
}
function openReport(r) {
  document.querySelector("#reportDetail").innerHTML = `
    <p class="eyebrow">${escapeHtml(r.reference || r.id)}</p><h1>${escapeHtml(r.event_type)}</h1>
    <div class="detail-grid">
      <div><b>Déclarant</b><span>${escapeHtml(r.reporter_name)} (${escapeHtml(r.company)})</span></div>
      <div><b>Client / site</b><span>${escapeHtml(r.client_name)} – ${escapeHtml(r.site_name)}</span></div>
      <div><b>Priorité</b><span>Priorité ${r.priority} (G${r.severity} × P${r.probability})</span></div>
      <div><b>Danger présent</b><span>${r.danger_present ? "Oui" : "Non"}</span></div>
    </div>
    <h3>Constat</h3><p>${escapeHtml(r.what)}</p><p>${escapeHtml(r.how)}</p>
    <h3>Actions immédiates</h3><p>${escapeHtml(r.action_details)}</p>
    <h3>Proposition d’amélioration</h3><p>${escapeHtml(r.improvement_proposal || "Non renseignée")}</p>
    <label>Statut<select id="statusEdit"><option>Nouvelle</option><option>Analyse en cours</option><option>Action à réaliser</option><option>En attente de vérification</option><option>Clôturée</option></select></label>
    <button class="primary" id="saveStatus">Enregistrer le statut</button>`;
  document.querySelector("#statusEdit").value = r.status;
  document.querySelector("#saveStatus").onclick = () => updateStatus(r, document.querySelector("#statusEdit").value);
  dialog.showModal();
}
async function updateStatus(report, status) {
  report.status = status;
  if (APP_CONFIG.mode === "supabase") {
    const response = await fetch(`${APP_CONFIG.supabaseUrl}/rest/v1/reports?id=eq.${report.id}`, {
      method:"PATCH", headers:{"apikey":APP_CONFIG.supabaseAnonKey,"Authorization":`Bearer ${APP_CONFIG.supabaseAnonKey}`,"Content-Type":"application/json"}, body:JSON.stringify({status})
    });
    if (!response.ok) return toast("Modification impossible.");
  } else localStorage.setItem("qse_reports", JSON.stringify(reports));
  dialog.close(); render(); toast("Statut mis à jour.");
}
document.querySelector(".dialog-close").onclick = () => dialog.close();
["searchFilter","companyFilter","priorityFilter"].forEach(id => document.querySelector(`#${id}`).addEventListener("input", render));
document.querySelector("#exportCsv").onclick = () => {
  const cols = ["reference","created_at","company","client_name","site_name","event_type","priority","status","reporter_name","what","action_details"];
  const quote = v => `"${String(v ?? "").replaceAll('"','""')}"`;
  const csv = [cols.join(";"), ...filtered().map(r => cols.map(c => quote(r[c])).join(";"))].join("\n");
  const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"}));
  link.download = "remontees-terrain.csv"; link.click(); URL.revokeObjectURL(link.href);
};
