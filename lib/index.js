/**
 * dsh-obsidian-skills — dsh bundle entry.
 *
 * Registers every skill shipped in ./skills/ with ctx.skills, so the Obsidian
 * skill set shows up in the agent's catalog once this package is installed as a
 * dsh profile bundle:
 *
 *   dsh plugin --profile <name> add dsh-obsidian-skills
 *
 * Each skill lives in skills/<name>/SKILL.md with its reference files beside it;
 * resourceBase points at that directory so the relative links inside the skill
 * body (references/CALLOUTS.md and friends) resolve correctly.
 *
 * The skill bodies are documentation only. No CLI binary is bundled: the
 * obsidian-cli, defuddle and knap skills describe how to drive tools the user
 * installs and runs themselves.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'dsh-obsidian-skills';
export const inject = ['skills'];

const SKILLS_ROOT = fileURLToPath(new URL('../skills/', import.meta.url));

/** Minimal YAML-frontmatter reader for the fields the registry needs. */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  const fm = match[1];
  const get = (key) => {
    const line = fm.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
    if (!line) return undefined;
    let value = line[1].trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    return value;
  };
  return {
    name: get('name'),
    description: get('description'),
    whenToUse: get('whenToUse'),
  };
}

/** Skill directories present on disk, sorted for deterministic registration. */
function skillDirectories() {
  let entries;
  try {
    entries = readdirSync(SKILLS_ROOT);
  } catch (error) {
    return { error };
  }
  return { entries: entries.filter((e) => !e.startsWith('.')).sort() };
}

export function apply(ctx) {
  const { entries, error } = skillDirectories();
  if (error) {
    ctx.logger?.warn?.(`dsh-obsidian-skills: cannot read ${SKILLS_ROOT}: ${error.message}`);
    return;
  }

  const disposers = [];
  let registered = 0;

  for (const dirName of entries) {
    const skillDir = join(SKILLS_ROOT, dirName);
    const file = join(skillDir, 'SKILL.md');
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const fm = parseFrontmatter(text);
    if (!fm?.name || !fm?.description) {
      ctx.logger?.warn?.(`dsh-obsidian-skills: ${dirName}/SKILL.md has no name/description; skipped`);
      continue;
    }

    const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();

    const dispose = ctx.skills.register({
      name: fm.name,
      description: fm.description,
      ...(fm.whenToUse ? { whenToUse: fm.whenToUse } : {}),
      content: body,
      source: 'runtime',
      resourceBase: { kind: 'directory', path: skillDir },
    });
    if (typeof dispose === 'function') disposers.push(dispose);
    registered += 1;
  }

  if (disposers.length > 0) {
    ctx.on('dispose', () => {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
          /* a skill already gone must not block teardown */
        }
      }
    });
  }

  ctx.logger?.info?.(`dsh-obsidian-skills: registered ${registered} skill(s)`);
}
