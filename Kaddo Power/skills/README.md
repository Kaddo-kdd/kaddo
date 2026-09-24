# Generated Agent Plugin Skills

These `SKILL.md` files are portable projections of the canonical Kaddo Skills in
`packages/cli/src/skills/skills.ts`.

Do not edit generated files directly. From the repository root, run:

```bash
pnpm agent-plugin:sync
pnpm agent-plugin:check
```

The transformation replaces Kaddo's installed-asset front matter with the `name` and `description`
fields required by Agent Skills. It does not maintain a second copy of Kaddo methodology.

Client-specific behavior belongs outside these files, such as Kiro guidance under `dev.kiro/`.
