// Simple SPA state
const state = {
  currentScreenId: "dashboard",
  projects: [
    { id: "seed-1", title: "Lot 243 – East Van", files: [], createdAt: new Date() }
  ],
  lenders: [
    { id: "l1", name: "NorthPeak Lending", rate: "8.5%", amount: "$250,000", time: "3-5 days" },
    { id: "l2", name: "Cedar Ridge Capital", rate: "9.2%", amount: "$400,000", time: "1-2 weeks" },
    { id: "l3", name: "Granite Finance", rate: "7.9%", amount: "$150,000", time: "48 hours" },
    { id: "l4", name: "Summit Builders Bank", rate: "8.1%", amount: "$300,000", time: "4-7 days" },
    { id: "l5", name: "UrbanWorks Credit", rate: "10.0%", amount: "$500,000", time: "2 weeks" },
    { id: "l6", name: "Horizon Funding", rate: "8.9%", amount: "$350,000", time: "5 days" }
  ],
  budget: [
    { key: "labor", label: "Labor", spent: 125000, total: 250000 },
    { key: "materials", label: "Materials", spent: 90000, total: 200000 },
    { key: "permits", label: "Permits", spent: 12000, total: 30000 },
    { key: "misc", label: "Miscellaneous", spent: 8000, total: 20000 }
  ]
};

// DOM helpers
function $(selector, root = document) { return root.querySelector(selector); }
function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

// Navigation
function showScreen(screenId) {
  state.currentScreenId = screenId;
  $all(".screen").forEach(el => el.classList.remove("is-active"));
  const next = document.getElementById(screenId);
  if (next) next.classList.add("is-active");
  // focus first heading for a11y
  const h1 = next ? next.querySelector("h1") : null;
  if (h1) h1.focus?.();
}

function wireNavigation() {
  $all("[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      showScreen(btn.getAttribute("data-target"));
    });
  });

  $all(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      showScreen(btn.getAttribute("data-target"));
    });
  });
}

// Projects / Upload
function renderProjects() {
  const container = $("#projects-list");
  if (!container) return;
  container.innerHTML = state.projects.map(p => {
    const fileCount = p.files.length;
    const created = new Date(p.createdAt).toLocaleString();
    return `
      <div class="project-card">
        <div class="title">${p.title}</div>
        <div class="meta">${fileCount} file${fileCount === 1 ? "" : "s"} • Created ${created}</div>
      </div>
    `;
  }).join("");
}

function wireUpload() {
  const drop = $("#upload-drop");
  const input = $("#project-file");
  if (!drop || !input) return;

  function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const projectTitle = files[0].name ? files[0].name.replace(/\.[^.]+$/, "") : "New Project";
    state.projects.unshift({ id: `p-${Date.now()}`, title: projectTitle, files, createdAt: new Date() });
    renderProjects();
    showToast("Project uploaded");
  }

  ["dragenter","dragover"].forEach(evt => {
    drop.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); drop.classList.add("is-drag"); });
  });
  ["dragleave","drop"].forEach(evt => {
    drop.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); drop.classList.remove("is-drag"); });
  });
  drop.addEventListener("drop", e => {
    handleFiles(e.dataTransfer.files);
  });
  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => handleFiles(input.files));
}

// Lenders
function renderLenders() {
  const container = $("#lenders-list");
  if (!container) return;
  container.innerHTML = state.lenders.map(l => `
    <div class="lender-card">
      <h3>${l.name}</h3>
      <div class="lender-row"><span>Interest Rate</span><strong>${l.rate}</strong></div>
      <div class="lender-row"><span>Funding Amount</span><strong>${l.amount}</strong></div>
      <div class="lender-row"><span>Approval Time</span><strong>${l.time}</strong></div>
      <div class="lender-actions">
        <button class="btn btn-accent" data-terms='${JSON.stringify(l)}'>View Loan Terms</button>
      </div>
    </div>
  `).join("");

  $all("[data-terms]").forEach(btn => {
    btn.addEventListener("click", () => {
      const data = JSON.parse(btn.getAttribute("data-terms"));
      openModal(renderTermsHtml(data));
    });
  });
}

function renderTermsHtml(lender) {
  return `
    <div>
      <p><strong>${lender.name}</strong></p>
      <ul>
        <li>Interest: ${lender.rate}</li>
        <li>Funding: ${lender.amount}</li>
        <li>Approval: ${lender.time}</li>
      </ul>
      <p class="muted">Terms are illustrative. Future enhancement: configure fractional funding and syndication.</p>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button class="btn btn-accent" data-close>Proceed</button>
        <button class="btn" data-close>Close</button>
      </div>
    </div>
  `;
}

// Budget
function renderBudget() {
  const container = $("#budget-bars");
  if (!container) return;
  container.innerHTML = state.budget.map(b => {
    const pct = Math.min(100, Math.round((b.spent / b.total) * 100));
    return `
      <div class="budget-item">
        <div class="budget-header">
          <div>${b.label}</div>
          <div><strong>$${numberFmt(b.spent)}</strong> / $${numberFmt(b.total)} (${pct}%)</div>
        </div>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

// Draw form
function wireDrawForm() {
  const form = $("#draw-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    showToast("Draw request submitted");
    form.reset();
    showScreen("dashboard");
  });
}

// Quick actions
function wireQuickActions() {
  $all("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      if (action === "apply-loan") showScreen("loan-matching");
      else if (action === "submit-draw") showScreen("draw-request");
      else if (action === "track-progress") showScreen("budget-tracker");
      else if (action === "invite-team") {
        openModal(`<div>
          <h3 style="margin-top:0">Invite Team</h3>
          <p class="muted">Send invitations to collaborators (GCs, subs, PMs). Coming soon.</p>
          <div style="display:flex; gap:8px; margin-top:12px">
            <button class="btn btn-accent" data-close>Okay</button>
          </div>
        </div>`);
      }
    });
  });
}

// Modal / Toast
function openModal(html) {
  const modal = $("#modal");
  const body = $("#modal-body");
  if (!modal || !body) return;
  body.innerHTML = html;
  modal.setAttribute("aria-hidden", "false");
  $all("[data-close]", modal).forEach(btn => btn.addEventListener("click", closeModal, { once: true }));
}
function closeModal() {
  const modal = $("#modal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
}
function showToast(text, timeout = 2200) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), timeout);
}

// Utils
function numberFmt(num) {
  return (num || 0).toLocaleString();
}

// Init
function init() {
  wireNavigation();
  wireUpload();
  wireQuickActions();
  wireDrawForm();
  renderProjects();
  renderLenders();
  renderBudget();
  showScreen(state.currentScreenId);
}

document.addEventListener("DOMContentLoaded", init);

