# CLAUDE.md — tokengaroo

@AGENTS.md

## Claude Code specifics

- **This repo is the skill.** `~/.claude/skills/tokengaroo` symlinks here, so `SKILL.md` edits change how
  the `tokengaroo` skill behaves in every session at once. Keep its frontmatter `description` precise:
  it is the trigger.
- Don't invoke the `tokengaroo` skill to work on this repo. It is written for *users'* projects (it
  copies `template/` elsewhere). Here, follow `AGENTS.md` and edit `template/` in place.
- **Look at the output with the Read tool**: open `qa/img/<variant>.still.png` and any
  `qa/img/<variant>.<check>.png` evidence before editing to fix a finding. Read `qa/report.md` first.
- Point `--out` for scratch builds and QA runs at the session scratchpad, or at the gitignored `dist/`
  and `qa/`. `check.mjs` wipes its `--out` directory.
- Reduced-motion still, when you need one outside the harness:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --force-prefers-reduced-motion --window-size=1600,900 --screenshot=out.png file:///abs/path.svg`
- The parent workspace `AGENTS.md`/`AGENTS-MCP.md` (casino platform) loads too because of the directory
  hierarchy. Ignore its MCP, GitNexus, Graphiti and coding-contract rules here.
