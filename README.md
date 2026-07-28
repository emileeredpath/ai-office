# ai-office

AI Office is a Sandy-orchestrated workflow dashboard. You speak to Sandy, Sandy
routes work to the right team member, and the office updates automatically.

Live at: https://ai-office-production-2f2c.up.railway.app

The frontend and backend API are served from the same Railway service, backed
by the same database Claude's MCP tools read and write — there is no
GitHub Pages deployment any more (the previous public copy at
`emileeredpath.github.io/ai-office/` should be disabled in the repo's Pages
settings; it no longer receives updates and must not be treated as current).

Sign-in uses a single shared team password (with a separate view-only
password for John) — see `backend/.env.example` for the environment
variables that configure it.
