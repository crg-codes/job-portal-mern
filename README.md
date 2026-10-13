# Job Portal (MERN + TailwindCSS)

## Run locally
1. Install MongoDB (or use MongoDB Atlas) and set `MONGO_URI` in `server/.env`.
2. Install packages (do this on YOUR machine, `node_modules` is not included):
3. Add demo data (optional, recommended): `cd server && npm run seed`
4. Start: `cd server && npm run dev`  and  `cd client && npm run dev`
5. Open http://localhost

Forgot password: if SMTP is not configured, the reset link is printed in the server console.

## Browse Jobs (/jobs)
- All published, non-expired jobs load automatically.
- Keyword search (title, skills, description, company): typing `React` shows React jobs (live, debounced).
- Location dropdown (Chennai, Bangalore ...), filled from real jobs. Bangalore also finds Bengaluru.
- Combinable filters: job type, experience, work mode, salary range + currency, date posted, sort.
- Filters live in the URL, so Back button and shared links work.

## Recommended Jobs (/recommended-jobs)
Score 0-100 from: skills (40), title vs headline/past roles (10), jobs you applied before (10),
location (15), job type (5), experience level (10), work mode (5), salary (5).
Already-applied jobs are never recommended. Each card shows "why" it matched.

## Apply / ATS
- One application per job per seeker (checked in code and by a unique DB index).
- Seeker tracks status + timeline in My Applications and can withdraw.
- Employer: Manage Jobs (create/edit/publish/pause/delete) -> ATS board per job
  (drag cards or use dropdown, notes, resume link, skill-match %, search).
