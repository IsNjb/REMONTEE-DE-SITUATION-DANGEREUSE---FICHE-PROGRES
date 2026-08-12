const form = document.querySelector("#reportForm");
const pages = [...document.querySelectorAll(".form-page")];
const stepItems = [...document.querySelectorAll(".steps li")];
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const photosInput = document.querySelector("#photos");
const preview = document.querySelector("#photoPreview");
let page = 1;
let selectedPhotos = [];

const riskMap = {
  "1-1":3,"1-2":3,"1-3":3,"1-4":3,
  "2-1":3,"2-2":2,"2-3":2,"2-4":2,
  "3-1":3,"3-2":2,"3-3":1,"3-4":1,
  "4-1":2,"4-2":2,"4-3":1,"4-4":1
};

function toast(message) {
  const node = document.querySelector("#toast");
  node.textContent = message; node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 3000);
}

function showPage(next) {
  page = next;
  pages.forEach((p, i) => p.classList.toggle("active", i === page - 1));
  stepItems.forEach((s, i) => {
    s.classList.toggle("active", i === page - 1);
    s.classList.toggle("done", i < page - 1);
  });
  prevButton.hidden = page === 1;
  nextButton.hidden = page === pages.length;
  if (page === 5) buildSummary();
  window.scrollTo({top: 0, behavior: "smooth"});
}

function validatePage() {
  const required = [...pages[page - 1].querySelectorAll("[required]")];
  for (const field of required) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  if (page === 2 && selectedPhotos.length === 0 && !form.photo_forbidden.checked) {
    toast("Ajoutez une photo ou indiquez pourquoi elle est impossible.");
    return false;
  }
  return true;
}

nextButton.addEventListener("click", () => validatePage() && showPage(page + 1));
prevButton.addEventListener("click", () => showPage(page - 1));
document.querySelector("#photoButton").addEventListener("click", () => photosInput.click());

photosInput.addEventListener("change", () => {
  selectedPhotos = [...photosInput.files].slice(0, 5);
  if (photosInput.files.length > 5) toast("Seules les 5 premières photos seront conservées.");
  renderPhotos();
});

function renderPhotos() {
  preview.innerHTML = "";
  selectedPhotos.forEach((file, index) => {
    const item = document.createElement("div");
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file); img.alt = `Photo ${index + 1}`;
    const remove = document.createElement("button");
    remove.type = "button"; remove.textContent = "×"; remove.ariaLabel = "Supprimer";
    remove.onclick = () => { selectedPhotos.splice(index, 1); renderPhotos(); };
    item.append(img, remove); preview.append(item);
  });
}

function calculateRisk() {
  const s = form.severity.value, p = form.probability.value;
  const result = document.querySelector("#riskResult");
  document.querySelectorAll(".matrix-cell").forEach(c => c.classList.remove("selected"));
  if (!s || !p) {
    result.className = "risk-result neutral";
    result.querySelector("strong").textContent = "À calculer";
    result.querySelector("small").textContent = "Sélectionnez les deux critères.";
    return null;
  }
  const priority = riskMap[`${s}-${p}`];
  result.className = `risk-result priority-${priority}`;
  result.querySelector("strong").textContent = `Priorité ${priority}`;
  result.querySelector("small").textContent = priority === 1 ? "Traitement urgent" : priority === 2 ? "Action rapide à programmer" : "À surveiller / améliorer";
  document.querySelector(`.matrix-cell[data-key="${s}-${p}"]`)?.classList.add("selected");
  return priority;
}

function buildMatrix() {
  const grid = document.querySelector("#matrixGrid");
  for (let severity = 4; severity >= 1; severity--) {
    for (let probability = 1; probability <= 4; probability++) {
      const priority = riskMap[`${severity}-${probability}`];
      const cell = document.createElement("span");
      cell.className = `matrix-cell priority-${priority}`;
      cell.dataset.key = `${severity}-${probability}`;
      cell.textContent = priority;
      cell.title = `Gravité ${severity}, probabilité ${probability}, priorité ${priority}`;
      grid.append(cell);
    }
  }
}
form.severity.addEventListener("change", calculateRisk);
form.probability.addEventListener("change", calculateRisk);
buildMatrix();

function values() {
  const data = Object.fromEntries(new FormData(form).entries());

  delete data.accuracy;
  delete data.photos;

  data.immediate_actions = [...form.querySelectorAll('[name="immediate_actions"]:checked')].map(x => x.value);
  data.severity = Number(data.severity);
  data.probability = Number(data.probability);
  data.priority = calculateRisk();
  data.danger_present = data.danger_present === "true";
  data.created_at = new Date().toISOString();

  return data;
}

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function buildSummary() {
  const d = values();
  document.querySelector("#summary").innerHTML = `
    <dl>
      <div><dt>Déclarant</dt><dd>${escapeHtml(d.reporter_name)} – ${escapeHtml(d.company)}</dd></div>
      <div><dt>Lieu</dt><dd>${escapeHtml(d.client_name)} / ${escapeHtml(d.site_name)}</dd></div>
      <div><dt>Type</dt><dd>${escapeHtml(d.event_type)}</dd></div>
      <div><dt>Constat</dt><dd>${escapeHtml(d.what)}</dd></div>
      <div><dt>Photos</dt><dd>${selectedPhotos.length || "Aucune (justifié)"}</dd></div>
      <div><dt>Évaluation</dt><dd>Gravité ${d.severity} × Probabilité ${d.probability} — <b>Priorité ${d.priority}</b></dd></div>
      <div><dt>Actions</dt><dd>${escapeHtml(d.action_details)}</dd></div>
      <div><dt>Danger présent</dt><dd>${d.danger_present ? "Oui" : "Non"}</dd></div>
    </dl>`;
}

async function compressImage(file) {
  const image = await createImageBitmap(file);
  const max = 1600, ratio = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .78));
}

async function saveDemo(data) {
  const reports = JSON.parse(localStorage.getItem("qse_reports") || "[]");
  const year = new Date().getFullYear();
  data.id = crypto.randomUUID();
  data.reference = `RT-${data.company}-${year}-${String(reports.length + 1).padStart(4, "0")}`;
  data.status = "Nouvelle";
  data.photo_names = selectedPhotos.map(p => p.name);
  reports.unshift(data);
  localStorage.setItem("qse_reports", JSON.stringify(reports));
  return data.reference;
}

async function saveSupabase(data) {
  const headers = {
  "apikey": APP_CONFIG.supabaseAnonKey
};
  const reportId = crypto.randomUUID();
  const paths = [];
  for (let i = 0; i < selectedPhotos.length; i++) {
    const blob = await compressImage(selectedPhotos[i]);
    const path = `${reportId}/${i + 1}.jpg`;
    const upload = await fetch(`${APP_CONFIG.supabaseUrl}/storage/v1/object/report-photos/${path}`, {
      method: "POST", headers: {...headers, "Content-Type": "image/jpeg", "x-upsert": "false"}, body: blob
    });
    if (!upload.ok) throw new Error("Échec de l’envoi d’une photo");
    paths.push(path);
  }
  data.id = reportId; data.photo_paths = paths; data.status = "Nouvelle";
  const response = await fetch(`${APP_CONFIG.supabaseUrl}/rest/v1/reports`, {
    method: "POST", headers: {...headers, "Content-Type": "application/json", "Prefer": "return=representation"}, body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Échec de l’enregistrement");
  const [saved] = await response.json();
  return saved.reference || reportId.slice(0, 8).toUpperCase();
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  const button = form.querySelector(".submit");
  button.disabled = true; button.textContent = "Envoi en cours…";
  try {
    const reference = APP_CONFIG.mode === "supabase" ? await saveSupabase(values()) : await saveDemo(values());
    form.hidden = true; document.querySelector(".steps").hidden = true; document.querySelector(".hero").hidden = true;
    document.querySelector("#reportNumber").textContent = reference;
    document.querySelector("#success").hidden = false;
  } catch (error) {
    toast(`${error.message}. Vérifiez la connexion et réessayez.`);
  } finally {
    button.disabled = false; button.textContent = "Envoyer la remontée";
  }
});

document.querySelector("#newReport").addEventListener("click", () => location.reload());
form.observed_at.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
