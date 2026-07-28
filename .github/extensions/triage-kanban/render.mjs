// HTML renderer for the triage Kanban board canvas.
//
// The board is a static, self-contained document served from the extension's
// loopback server. It has no privileged bridge to the host, so the only
// client-side behaviour is a fetch() POST to the extension's own
// /add-to-context endpoint when a card's button is clicked.

import { ISSUES } from "./issues.mjs";

/** Escape a string for safe interpolation into HTML text/attribute context. */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderTopCard(issue) {
    return `<article class="card card--top" data-testid="issue-card-${issue.number}">
  <header class="card__head">
    <span class="rank" aria-label="Priority ${issue.rank}">#${issue.rank}</span>
    <span class="issue-ref">Issue #${issue.number}</span>
  </header>
  <h3 class="card__title">${escapeHtml(issue.title)}</h3>
  <p class="card__desc">${escapeHtml(issue.description)}</p>
  <div class="why" data-testid="issue-justification-${issue.number}">
    <span class="why__label">Why it's a priority</span>
    <p class="why__text">${escapeHtml(issue.justification)}</p>
  </div>
  <footer class="card__foot">
    <button
      type="button"
      class="btn btn--primary add-btn"
      data-issue="${issue.number}"
      data-testid="add-to-context-${issue.number}"
    >Add to session context</button>
    <a class="btn btn--ghost" href="${escapeHtml(issue.url)}" target="_blank" rel="noreferrer noopener" data-testid="view-issue-${issue.number}">View on GitHub ↗</a>
  </footer>
  <p class="status" role="status" aria-live="polite" data-testid="add-status-${issue.number}"></p>
</article>`;
}

function renderBacklogCard(issue) {
    const tags = [];
    if (issue.impact) tags.push(`<span class="tag tag--impact">Impact: ${escapeHtml(issue.impact)}</span>`);
    if (issue.effort) tags.push(`<span class="tag tag--effort">Effort: ${escapeHtml(issue.effort)}</span>`);
    return `<article class="card card--backlog" data-testid="issue-card-${issue.number}">
  <header class="card__head">
    <span class="issue-ref">Issue #${issue.number}</span>
    <span class="tags">${tags.join("")}</span>
  </header>
  <h3 class="card__title card__title--sm">${escapeHtml(issue.title)}</h3>
  <p class="card__desc">${escapeHtml(issue.description)}</p>
  <footer class="card__foot">
    <button
      type="button"
      class="btn btn--primary btn--sm add-btn"
      data-issue="${issue.number}"
      data-testid="add-to-context-${issue.number}"
    >Add to session context</button>
    <a class="btn btn--ghost btn--sm" href="${escapeHtml(issue.url)}" target="_blank" rel="noreferrer noopener" data-testid="view-issue-${issue.number}">View ↗</a>
  </footer>
  <p class="status" role="status" aria-live="polite" data-testid="add-status-${issue.number}"></p>
</article>`;
}

/** Render the full board document for a canvas instance. */
export function renderHtml() {
    const top = ISSUES.filter((i) => i.lane === "top").sort((a, b) => a.rank - b.rank);
    const backlog = ISSUES.filter((i) => i.lane === "backlog").sort((a, b) => a.rank - b.rank);

    return `<!doctype html>
<html lang="en" data-color-mode="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Triage board</title>
<style>
:root {
  --bg: var(--background-color-default, #0f172a);
  --surface: #1e293b;
  --surface-2: #334155;
  --border: var(--border-color-default, #334155);
  --text: var(--text-color-default, #e2e8f0);
  --muted: var(--text-color-muted, #94a3b8);
  --accent: var(--true-color-blue, #3b82f6);
  --accent-strong: #2563eb;
  --hot: var(--true-color-red, #f87171);
  --focus: var(--color-focus-outline, #60a5fa);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 24px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--text-body-medium, 14px);
  line-height: var(--leading-body-medium, 20px);
}
.page-head { margin-bottom: 20px; }
.page-head h1 {
  margin: 0 0 4px;
  font-size: var(--text-title-large, 24px);
  font-weight: var(--font-weight-semibold, 600);
}
.page-head p { margin: 0; color: var(--muted); }
.lane { margin-bottom: 28px; }
.lane__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.lane__head h2 { margin: 0; font-size: 16px; font-weight: var(--font-weight-semibold, 600); }
.lane__count {
  color: var(--muted);
  font-size: 12px;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 2px 8px;
}
.grid { display: grid; gap: 16px; }
.grid--top { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.grid--backlog { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
.card--top { border-top: 3px solid var(--hot); }
.card--backlog { background: color-mix(in srgb, var(--surface) 85%, transparent); }
.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.rank {
  font-weight: 700;
  color: var(--hot);
  background: color-mix(in srgb, var(--hot) 16%, transparent);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 13px;
}
.issue-ref { color: var(--muted); font-size: 12px; }
.card__title { margin: 0 0 8px; font-size: 16px; line-height: 1.35; }
.card__title--sm { font-size: 15px; }
.card__desc { margin: 0 0 12px; color: var(--text); opacity: 0.92; }
.why {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}
.why__label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 4px;
}
.why__text { margin: 0; font-size: 13px; color: var(--text); }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag {
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 8px;
}
.card__foot { display: flex; gap: 8px; align-items: center; margin-top: auto; flex-wrap: wrap; }
.btn {
  font: inherit;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}
.btn--sm { padding: 6px 10px; font-size: 13px; }
.btn--primary { background: var(--accent-strong); color: #fff; }
.btn--primary:hover { background: var(--accent); }
.btn--primary:disabled { opacity: 0.6; cursor: default; }
.btn--ghost { background: transparent; color: var(--text); border-color: var(--border); }
.btn--ghost:hover { background: var(--surface-2); }
.btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.status { margin: 10px 0 0; font-size: 13px; min-height: 1em; color: var(--muted); }
.status.is-ok { color: #4ade80; }
.status.is-err { color: var(--hot); }
</style>
</head>
<body>
<header class="page-head">
  <h1>Triage board</h1>
  <p>${ISSUES.length} open issues · click <strong>Add to session context</strong> to start working on one right away.</p>
</header>

<section class="lane" aria-labelledby="lane-top" data-testid="lane-top">
  <div class="lane__head">
    <h2 id="lane-top">🔥 Needs attention now</h2>
    <span class="lane__count">${top.length}</span>
  </div>
  <div class="grid grid--top">
    ${top.map(renderTopCard).join("\n    ")}
  </div>
</section>

<section class="lane" aria-labelledby="lane-backlog" data-testid="lane-backlog">
  <div class="lane__head">
    <h2 id="lane-backlog">📋 Backlog</h2>
    <span class="lane__count">${backlog.length}</span>
  </div>
  <div class="grid grid--backlog">
    ${backlog.map(renderBacklogCard).join("\n    ")}
  </div>
</section>

<script>
document.addEventListener("click", async (event) => {
  const btn = event.target.closest(".add-btn");
  if (!btn) return;
  const issue = btn.dataset.issue;
  const status = document.querySelector('[data-testid="add-status-' + issue + '"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Adding…";
  if (status) { status.className = "status"; status.textContent = ""; }
  try {
    const res = await fetch("/add-to-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue: Number(issue) }),
    });
    if (!res.ok) throw new Error("Request failed (" + res.status + ")");
    btn.textContent = "Added ✓";
    if (status) { status.className = "status is-ok"; status.textContent = "Sent to this session — check the chat to get started."; }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = original;
    if (status) { status.className = "status is-err"; status.textContent = "Couldn't add to context. Please try again."; }
  }
});
</script>
</body>
</html>`;
}
