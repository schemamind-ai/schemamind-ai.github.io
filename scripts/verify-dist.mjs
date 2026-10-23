// Checks the production build in dist/ before it is published:
//   - no private data (long digit runs such as ID numbers, e-mail addresses,
//     local file paths, references to private project files);
//   - no claims of results the project does not have yet;
//   - every internal link and asset reference points to an existing file.
// PDFs are checked separately by scripts/check-pdfs.py (needs Python and pypdf).
// Usage: npm run build && npm run verify

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const textTypes = new Set(['.html', '.xml', '.txt', '.js', '.css', '.svg', '.json', '.webmanifest']);

const privacyRules = [
  // Any run of 9+ digits, except the fractional part of a decimal number.
  { name: 'digit run of 9 or more (possible ID number)', pattern: /(?<!\d\.\d*)\d{9,}/ },
  { name: 'e-mail address', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { name: 'local file path', pattern: /\/Users\/|\/home\/[a-z]|[A-Z]:\\\\/ },
  { name: 'private project file', pattern: /Arastirma|\.docx|research-plan|claude\.ai\/artifact/i },
];

// Claims that are not allowed while the project is at the proposal stage.
const claimRules = [
  /\boutperform(s|ed)?\b/i,
  /\bstate[- ]of[- ]the[- ]art\b/i,
  /\bnovel\b/i,
  /\bfirst (to|study|work)\b/i,
  /\bbreakthrough\b/i,
  /\brevolutioni[sz]e/i,
  /\bwe (have )?(achieved|demonstrated|shown|proven)\b/i,
  /\baccuracy of \d/i,
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

if (!existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const files = walk(dist);
const problems = [];

for (const file of files) {
  const rel = relative(dist, file);
  if (!textTypes.has(extname(file))) continue;
  const content = readFileSync(file, 'utf8');

  for (const rule of privacyRules) {
    const match = content.match(rule.pattern);
    if (match) problems.push(`${rel}: ${rule.name}: "${match[0]}"`);
  }

  if (extname(file) === '.html') {
    // Meta descriptions and social-preview text are public too, so check them as well.
    const metaText = [...content.matchAll(/<meta[^>]+content="([^"]*)"/g)].map((m) => m[1]).join(' ');
    const text = metaText + ' ' + content
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    for (const rule of claimRules) {
      const match = text.match(rule);
      if (match) problems.push(`${rel}: unsupported claim wording: "${match[0]}"`);
    }

    for (const [, ref] of content.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const target = ref.endsWith('/') ? join(dist, ref, 'index.html') : join(dist, ref);
      if (!existsSync(target)) problems.push(`${rel}: broken internal reference ${ref}`);
    }
  }
}

const allowedTypes = new Set([...textTypes, '.png', '.pdf', '.woff2', '.woff', '.ico']);
for (const file of files) {
  const ext = extname(file);
  if (!allowedTypes.has(ext)) problems.push(`${relative(dist, file)}: unexpected file type ${ext || '(none)'}`);
  if (ext === '.pdf' && statSync(file).size > 5 * 1024 * 1024) {
    problems.push(`${relative(dist, file)}: PDF larger than 5 MB`);
  }
}

if (problems.length) {
  console.error(`Verification failed (${problems.length} problem(s)):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Verification passed: ${files.length} files checked in dist/.`);
