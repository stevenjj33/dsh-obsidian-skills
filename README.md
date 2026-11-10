# dsh-obsidian-skills

Agent skills for [Obsidian](https://obsidian.md), packaged as a DeepSeek Harness plugin bundle.

Wraps the six skills from **[kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)** so they appear in the DSH skill catalog.

```
skill                     what it teaches
─────────────────────────────────────────────────────────────────────────
obsidian-markdown         Obsidian Flavored Markdown — wikilinks, embeds,
                          callouts, properties, comments
obsidian-bases            .base files — views, filters, formulas, summaries
json-canvas               .canvas files — nodes, edges, groups (JSON Canvas 1.0)
obsidian-cli              driving the obsidian CLI against a running vault
defuddle                  clean Markdown extraction from HTML via Defuddle CLI
knap                      template rendering via the Knap CLI
```

## Documentation only — no binaries bundled

This package ships **skill text, not tools**. Nothing here installs or runs a CLI.
Three of the skills describe how to drive command-line tools; those tools are
installed and run by you:

| Skill | Needs | Install |
|---|---|---|
| `obsidian-cli` | `obsidian` CLI, Obsidian running | see [Obsidian CLI docs](https://help.obsidian.md/cli) |
| `defuddle` | `defuddle` | `npm install -g defuddle` |
| `knap` | `knap` (Node 20+) | `npm install -g knap` |

The other three (`obsidian-markdown`, `obsidian-bases`, `json-canvas`) are pure
format references — they need nothing installed.

## Install

```bash
dsh plugin --profile <name> add dsh-obsidian-skills
```

Or from a local checkout:

```bash
dsh plugin --profile <name> add file:/absolute/path/to/dsh-obsidian-skills
```

Restart DSH afterwards; the six skills then appear in the catalog.

## Repository layout

```
├── lib/index.js                   loader: scans skills/*/SKILL.md, registers each with ctx.skills
├── scripts/
│   ├── sync-skills.mjs            pulls skills from the upstream clone into ./skills
│   └── verify-package.mjs         pre-publish check: frontmatter, dead links, manifest, credentials
├── skills.manifest.json           manifest (generated)
├── cordis.patch.yml               dsh bundle patch
└── skills/
    ├── obsidian-markdown/
    │   ├── SKILL.md
    │   └── references/{PROPERTIES,EMBEDS,CALLOUTS}.md
    ├── obsidian-bases/
    │   ├── SKILL.md
    │   └── references/FUNCTIONS_REFERENCE.md
    ├── json-canvas/
    │   ├── SKILL.md
    │   └── references/EXAMPLES.md
    ├── obsidian-cli/SKILL.md
    ├── defuddle/SKILL.md
    └── knap/SKILL.md
```

## Keeping up with upstream

The skill bodies are **copied verbatim** from upstream — never edited here.
To pull a newer upstream revision:

```bash
# 1. refresh the clone (default location, or point OBSIDIAN_SKILLS_SRC elsewhere)
rm -rf /tmp/obsidian-skills-src
git clone git@github.com:kepano/obsidian-skills.git /tmp/obsidian-skills-src

# 2. regenerate ./skills and the manifest
npm run sync

# 3. confirm nothing is stale, then check the package
npm run sync:check   # exit 0 = in sync with upstream
npm run verify
```

`sync-skills.mjs` clones upstream automatically when the source directory is
missing, and removes skill directories upstream no longer ships.

| Variable | Default | Purpose |
|---|---|---|
| `OBSIDIAN_SKILLS_SRC` | `/tmp/obsidian-skills-src` | local clone to read from |
| `OBSIDIAN_SKILLS_REF` | `main` | branch to clone when absent |

## Provenance and licensing

- `skills/**` — copied verbatim from [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills).
  Wording and structure belong to the original author (Steph Ango, MIT). This
  repository does not edit that text or claim authorship of it; it only
  materialises it on disk and registers it with DSH.
- `lib/`, `scripts/`, `cordis.patch.yml`, `package.json` — original work of this
  repository, MIT.
- Upstream is MIT licensed; the original `LICENSE` ships alongside as `LICENSE`,
  and `NOTICE` records the attribution.

No Obsidian vault content, no Obsidian license key, and no credentials are
included in this package.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
