#!/usr/bin/env node
/**
 * dsh-obsidian-skills — pre-publish package verification.
 *
 * Checks:
 *   1. every skills/<name>/SKILL.md has valid frontmatter (name, description)
 *   2. each frontmatter name matches its directory name
 *   3. every relative markdown link inside a skill body resolves on disk
 *   4. the manifest matches what is actually shipped
 *   5. no file in the package looks like a credential
 *
 * Exit 0 when clean, 1 otherwise.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, 'skills');
const MANIFEST = join(ROOT, 'skills.manifest.json');

const problems = [];
const notes = [];

/** Recursively list files under dir, relative to it. */
function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(full.slice(base.length + 1));
  }
  return out.sort();
}

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
  return { name: get('name'), description: get('description') };
}

// ── 1 & 2: frontmatter ────────────────────────────────────────────────────
const skillNames = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .sort();

const fileCounts = {};
for (const dirName of skillNames) {
  const dir = join(SKILLS_DIR, dirName);
  const skillFile = join(dir, 'SKILL.md');
  fileCounts[dirName] = walk(dir).length;

  if (!existsSync(skillFile)) {
    problems.push(`${dirName}: missing SKILL.md`);
    continue;
  }

  const text = readFileSync(skillFile, 'utf8');
  const fm = parseFrontmatter(text);
  if (fm === null) {
    problems.push(`${dirName}: SKILL.md has no YAML frontmatter`);
    continue;
  }
  if (!fm.name) problems.push(`${dirName}: frontmatter has no name`);
  if (!fm.description) problems.push(`${dirName}: frontmatter has no description`);
  if (fm.name && fm.name !== dirName) {
    problems.push(`${dirName}: frontmatter name "${fm.name}" != directory name`);
  }
  if (fm.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.name)) {
    problems.push(`${dirName}: name "${fm.name}" is not kebab-case`);
  }

  // ── 3: relative links resolve ──────────────────────────────────────────
  // Fenced code blocks and inline code are skipped: documentation legitimately
  // shows link syntax as an example (`[text](url)`), which is not a reference.
  const body = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/^```[\s\S]*?^```/gm, '')
    .replace(/`[^`\n]*`/g, '');
  for (const m of body.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    const link = m[1];
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    // Only paths that look like real files; a bare word is example syntax.
    if (!link.includes('/') && !/\.[a-z0-9]{1,5}$/i.test(link)) continue;
    const target = resolve(dir, link);
    if (!existsSync(target)) problems.push(`${dirName}: dead link ${link}`);
  }
}

notes.push(`frontmatter checked for ${skillNames.length} skill(s)`);
notes.push(`relative links resolved against each skill directory`);

// ── 4: manifest ──────────────────────────────────────────────────────────
if (!existsSync(MANIFEST)) {
  problems.push('skills.manifest.json is missing');
} else {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (error) {
    problems.push(`skills.manifest.json is not valid JSON: ${error.message}`);
  }
  if (manifest) {
    const shipped = manifest.skills?.map((s) => s.name).sort() ?? [];
    if (JSON.stringify(shipped) !== JSON.stringify(skillNames)) {
      problems.push(`manifest skills [${shipped}] != on-disk [${skillNames}]`);
    }
    if (manifest.skillCount !== skillNames.length) {
      problems.push(`manifest skillCount ${manifest.skillCount} != ${skillNames.length}`);
    }
    for (const entry of manifest.skills ?? []) {
      if (fileCounts[entry.name] !== undefined && entry.files !== fileCounts[entry.name]) {
        problems.push(`${entry.name}: manifest files ${entry.files} != ${fileCounts[entry.name]}`);
      }
    }
  }
  notes.push(`manifest checked: ${skillNames.length} skill(s)`);
}

// ── 5: credential-shaped literals ────────────────────────────────────────
const CREDENTIAL_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9]{36}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const PACKAGE_FILES = ['lib', 'skills', 'scripts'].flatMap((d) => {
  const full = join(ROOT, d);
  return existsSync(full) ? walk(full).map((f) => join(d, f)) : [];
});

let scanned = 0;
for (const rel of PACKAGE_FILES) {
  const full = join(ROOT, rel);
  if (!statSync(full).isFile()) continue;
  const text = readFileSync(full, 'utf8');
  scanned += 1;
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(text)) problems.push(`${rel}: looks like it contains a credential`);
  }
}
notes.push(`scanned ${scanned} package file(s) for credential-shaped literals`);

// ── report ───────────────────────────────────────────────────────────────

console.log('dsh-obsidian-skills — package verification');
console.log();
for (const n of notes) console.log(`  · ${n}`);
console.log();

if (problems.length === 0) {
  console.log('✅ package is clean: frontmatter valid, links live, manifest consistent.');
  process.exit(0);
}

console.error('❌ problems found:');
for (const p of problems) console.error(`  · ${p}`);
process.exit(1);
