# Festa – GenAI Event Planning Assistant

Plans **weddings, birthdays and community events**: budget split, dated timeline, vendor checklist and personalised ideas.

**Chosen vertical:** Event planning (wedding / birthday / community persona, selected by the user).

## How it works
1. The user enters type, date, guests, budget, currency and optional city/theme/notes.
2. `planner.js` validates input, then a **rule engine** builds the plan:
   - Budget split per event type (shares sum to 100%, includes contingency).
   - Timeline counted back from the event date; tasks already past are flagged **Do now**.
   - Vendor checklist per event type (ticks are saved in the browser).
   - Warnings for short lead time and low budget per guest (currency-scaled).
3. If `GEMINI_API_KEY` is set, **Gemini** rewrites the ideas and adds a budget tip using the user's city, theme and notes. Output is parsed as JSON, type-checked and length-capped. On any AI failure the rule-based plan is returned, so the app always works.

## Run
```bash
npm test          # Node 18+, no dependencies to install
npm start         # http://localhost:3000
GEMINI_API_KEY=... npm start   # enable Gemini ideas
```
Deploy: `Dockerfile` included (Cloud Run / Render). Set `GEMINI_API_KEY` as a secret env var.

## Design choices mapped to evaluation criteria
- **Code quality:** zero dependencies, small modules (`planner.js` logic, `server.js` transport, `public/` UI).
- **Security:** input validation and sanitising, 8 KB body limit, rate limit (20/min/IP), strict CSP and security headers, static allow-list, API key only from env, user text passed to the model as data with an instruction to ignore embedded commands, UI built with `textContent` (no `innerHTML`).
- **Efficiency:** rules run instantly; one optional AI call with an 8 s timeout.
- **Testing:** `node:test` suite covers validation, budget maths, timeline, warnings, AI merge/fallback and the HTTP API.
- **Accessibility:** labelled fields, `lang`, skip link, `aria-live` results, visible focus, text values beside every bar, reduced-motion support, responsive and printable.
- **Problem alignment:** budgets, timelines, vendor checklists and personalised ideas for the three event types.

## Assumptions
Budget shares and lead times are typical Indian-market defaults and are approximate. Per-guest floors are INR-based and scaled for other currencies. No user data is stored on the server.
