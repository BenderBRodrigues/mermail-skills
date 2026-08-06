# Skill template

Copy this folder to `skills/<your-skill-name>/`, then:

1. Rename files' skill id in `SKILL.md` frontmatter and `agents/openai.yaml` `default_prompt`
2. Fill tools ownership into root `tool-coverage.json`
3. Update `skills/mermail/references/routing.md` and `tests/scenarios.json`
4. Add the skill to the README included-skills table
5. Run `npm test`

This template directory is **not** validated as a live skill (it is not under `skills/`).
