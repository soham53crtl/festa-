'use strict';
const form = document.getElementById('form');
const out = document.getElementById('plan');
const err = document.getElementById('formerr');
form.date.min = new Date().toISOString().slice(0, 10);

// Build DOM with textContent only (never innerHTML) so model output can't inject markup.
function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => n.append(k));
  return n;
}
const fmt = (n, cur) => new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
const day = (s) => new Date(s + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function checklist(key, items) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch { /* storage unavailable */ }
  return el('ul', { className: 'chk' }, items.map((name, i) => {
    const box = el('input', { type: 'checkbox', checked: !!saved[name], id: `${key}-${i}` });
    box.addEventListener('change', () => {
      saved[name] = box.checked;
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch { /* ignore */ }
    });
    return el('li', {}, el('label', {}, box, el('span', { textContent: name })));
  }));
}

function render(p) {
  const cur = p.summary.currency;
  const nodes = [
    el('h2', { textContent: `${p.summary.type} plan` }),
    el('ul', { className: 'stats' }, [
      `${p.summary.guests} guests`, `${p.summary.daysLeft} days to go`,
      `${fmt(p.summary.perGuest, cur)} per guest`, `${fmt(p.summary.cateringPerGuest, cur)} per guest on food`
    ].map((t) => el('li', { textContent: t })))
  ];
  p.warnings.forEach((w) => nodes.push(el('p', { className: 'warn', role: 'note', textContent: w })));
  if (p.tip) nodes.push(el('p', { textContent: `Budget tip: ${p.tip}` }));

  nodes.push(el('h2', { textContent: 'Budget' }));
  p.budget.forEach((l) => nodes.push(el('div', { className: 'row' },
    el('span', { textContent: l.category }),
    el('div', { className: 'bar', role: 'img', ariaLabel: `${l.share} percent` }, el('i', { style: `width:${Number(l.share) * 3}%` })),
    el('strong', { textContent: `${fmt(l.amount, cur)} (${l.share}%)` }))));

  nodes.push(el('h2', { textContent: 'Timeline' }),
    el('ol', { className: 'tl' }, p.timeline.map((m) => el('li', {},
      el('time', { dateTime: m.due, textContent: day(m.due) }),
      el('span', { textContent: m.task }),
      m.status === 'catch-up' ? el('span', { className: 'tag', textContent: 'Do now' }) : ''))));

  nodes.push(el('h2', { textContent: 'Vendor checklist' }), checklist('vendors-' + p.summary.type, p.vendors.map((v) => v.name)));
  nodes.push(el('h2', { textContent: 'Ideas for you' }), el('ul', { className: 'ideas' }, p.ideas.map((i) => el('li', { textContent: i }))));
  nodes.push(el('p', { className: 'src', textContent: p.source === 'rules' ? 'Ideas from the built-in planner.' : `Ideas personalised with ${{ gemini: 'Gemini', groq: 'Groq', xai: 'Grok' }[p.source] || 'AI'}.` }));
  const print = el('button', { type: 'button', className: 'ghost', textContent: 'Print or save as PDF' });
  print.addEventListener('click', () => window.print());
  nodes.push(print);
  out.replaceChildren(...nodes);
  out.focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.textContent = '';
  const body = Object.fromEntries(new FormData(form));
  body.budget = Number(body.budget); body.guests = Number(body.guests);
  out.setAttribute('aria-busy', 'true');
  try {
    const r = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) { err.textContent = (j.errors || [j.error]).join('. '); return; }
    render(j);
  } catch { err.textContent = 'Could not reach the planner. Check your connection and try again.'; }
  finally { out.setAttribute('aria-busy', 'false'); }
});
