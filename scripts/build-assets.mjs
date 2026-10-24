// Generates the static assets in public/ that are committed to the repository:
//   - documents/schemamind-ai-project-proposal.pdf  (public copy of the proposal)
//   - documents/schemamind-ai-project-proposal-preview.png
//   - og-image.png, favicon.svg, favicon-32.png, apple-touch-icon.png
//
// Usage: npm run assets
//
// The proposal text comes from src/data (which contains no student numbers).
// The university logo is read from the original proposal one folder up, if it
// is present; the original file is only read, never modified or copied.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { site } from '../src/data/site.ts';
import { students, supervisor, jury } from '../src/data/people.ts';
import { proposalDescription } from '../src/data/proposal.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (path) => join(root, 'public', path);
// Fonts are inlined as data URLs: pages opened with setContent cannot load file:// URLs.
const fontFile = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', pkg, 'files', file)).toString('base64')}`;
// The original proposal lives one folder up; its file name may carry a suffix
// (e.g. team names), so match it by prefix and skip Word lock files.
const proposalName = readdirSync(resolve(root, '..')).find(
  (name) => name.startsWith('Senior Project Proposal') && name.endsWith('.docx'),
);
const originalProposal = proposalName ? resolve(root, '..', proposalName) : '';

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fonts = `
  @font-face { font-family: 'Source Serif 4'; font-weight: 200 900; src: url(${fontFile('@fontsource-variable/source-serif-4', 'source-serif-4-latin-opsz-normal.woff2')}) format('woff2'); }
  @font-face { font-family: 'Source Serif 4'; font-weight: 200 900; src: url(${fontFile('@fontsource-variable/source-serif-4', 'source-serif-4-latin-ext-opsz-normal.woff2')}) format('woff2'); unicode-range: U+0100-024F, U+0259, U+1E00-1EFF; }
  @font-face { font-family: 'IBM Plex Sans'; font-weight: 400; src: url(${fontFile('@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2')}) format('woff2'); }
  @font-face { font-family: 'IBM Plex Sans'; font-weight: 500; src: url(${fontFile('@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2')}) format('woff2'); }
  @font-face { font-family: 'IBM Plex Mono'; font-weight: 400; src: url(${fontFile('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2')}) format('woff2'); }
`;

const brandMark = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2.5" y="4.5" width="13" height="11" rx="2.5" stroke="#6fa8ff" stroke-width="2"/>
  <path d="M2.5 9h13" stroke="#6fa8ff" stroke-width="2"/>
  <rect x="16.5" y="16.5" width="13" height="11" rx="2.5" stroke="#a88bfa" stroke-width="2"/>
  <path d="M16.5 21h13" stroke="#a88bfa" stroke-width="2"/>
  <path d="M9 15.5v5.5h7.5" stroke="#e4e8f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Favicon: the brand mark on a navy tile, so it stays visible on light tabs.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#0a1022"/>
  <g transform="translate(3 3) scale(0.8125)">
    <rect x="2.5" y="4.5" width="13" height="11" rx="2.5" stroke="#6fa8ff" stroke-width="2.4"/>
    <path d="M2.5 9h13" stroke="#6fa8ff" stroke-width="2.4"/>
    <rect x="16.5" y="16.5" width="13" height="11" rx="2.5" stroke="#a88bfa" stroke-width="2.4"/>
    <path d="M16.5 21h13" stroke="#a88bfa" stroke-width="2.4"/>
    <path d="M9 15.5v5.5h7.5" stroke="#e4e8f2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

function universityLogoDataUrl() {
  if (!originalProposal || !existsSync(originalProposal)) {
    console.warn('Original proposal not found; the PDF will be rendered without the logo.');
    return null;
  }
  try {
    const jpeg = execFileSync('unzip', ['-p', originalProposal, 'word/media/image1.jpeg'], { stdio: ['ignore', 'pipe', 'ignore'] });
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  } catch {
    console.warn('Logo not found in the original proposal; the PDF will be rendered without it.');
    return null;
  }
}

function proposalHtml(logo) {
  const list = (items) => items.map((item) => `<div>${escape(item)}</div>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SchemaMind AI: Senior Project Proposal (public copy)</title>
<style>
  @page { size: A4; margin: 25mm 25mm 22mm; }
  body { margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.35; color: #000; }
  .head { text-align: center; }
  .logo { width: 42mm; height: auto; margin: 6mm auto 12mm; display: block; }
  .uni { font-size: 22pt; margin: 0 0 4mm; }
  .head p { margin: 0; font-size: 15pt; line-height: 1.3; }
  .project { margin-top: 6mm !important; font-size: 16pt !important; }
  h2 { font-size: 16pt; margin: 9mm 0 2mm; }
  .names div { margin: 0 0 1.5mm; }
  .desc p { margin: 0 0 3mm; text-align: left; }
  a { color: #1155cc; }
  .note { margin-top: 10mm; padding-top: 3mm; border-top: 0.5pt solid #999; font-size: 9pt; color: #444; }
</style></head>
<body>
  <div class="head">
    ${logo ? `<img class="logo" src="${logo}" alt="TED University logo">` : ''}
    <p class="uni">${escape(site.university.toUpperCase())}</p>
    <p>${escape(site.faculty)}</p>
    <p>${escape(site.departments)}</p>
    <p class="project">Project Name: <b>${escape(site.name)}</b></p>
  </div>
  <h2>Team Members:</h2>
  <div class="names">${list(students.map((s) => `${s.name} – ${s.department}`))}</div>
  <h2>Supervisor:</h2>
  <div class="names">${list([supervisor.name])}</div>
  <h2>Jury Members:</h2>
  <div class="names">${list(jury.map((j) => j.name))}</div>
  <h2>Link to the official website of the project:</h2>
  <div><a href="${escape(site.url)}">${escape(site.url)}</a></div>
  <h2>Description:</h2>
  <div class="desc">${proposalDescription.map((p) => `<p>${escape(p)}</p>`).join('')}</div>
  <p class="note">Public copy prepared for the project website. Student identification numbers have been removed. The project description is unchanged from the original proposal.</p>
</body></html>`;
}

const ogHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  ${fonts}
  html, body { margin: 0; width: 1200px; height: 630px; }
  body { background: #0a1022; color: #e4e8f2; font-family: 'IBM Plex Sans', sans-serif; position: relative; overflow: hidden; }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(111,168,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(111,168,255,.08) 1px, transparent 1px); background-size: 40px 40px; -webkit-mask-image: radial-gradient(ellipse 60% 90% at 78% 40%, #000 25%, transparent 75%); }
  .glow { position: absolute; width: 900px; height: 900px; right: -300px; top: -380px; background: radial-gradient(circle, rgba(168,139,250,.22), transparent 62%); }
  .content { position: absolute; left: 80px; top: 78px; width: 600px; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 22px; color: #a0aac3; }
  h1 { font-family: 'Source Serif 4', serif; font-size: 84px; line-height: 1; letter-spacing: -2px; margin: 56px 0 0; font-weight: 600; }
  .tag { font-family: 'Source Serif 4', serif; font-style: italic; font-size: 38px; line-height: 1.2; margin-top: 22px; color: #c9d6f2; }
  .meta { position: absolute; left: 80px; bottom: 70px; font-size: 22px; color: #a0aac3; }
  .tables { position: absolute; right: 70px; top: 170px; display: flex; gap: 34px; align-items: flex-start; font-family: 'IBM Plex Mono', monospace; font-size: 19px; }
  .t { width: 184px; border: 1.5px solid rgba(111,168,255,.6); border-radius: 8px; background: #0f172d; overflow: hidden; }
  .t.v { border-color: rgba(168,139,250,.6); margin-top: 60px; }
  .t div { height: 44px; display: flex; align-items: center; padding: 0 16px; border-top: 1px solid #26324f; }
  .t div:first-child { border-top: 0; background: rgba(111,168,255,.14); }
  .t.v div:first-child { background: rgba(168,139,250,.14); }
  .ren { background: rgba(240,189,94,.12); color: #f0bd5e; box-shadow: inset 3px 0 0 #f0bd5e; }
  .ren s { color: #a0aac3; margin-right: 10px; text-decoration-color: #f0bd5e; }
</style></head><body>
  <div class="grid"></div><div class="glow"></div>
  <div class="content">
    <div class="brand">${brandMark(34)} TED University senior project</div>
    <h1>${escape(site.name)}</h1>
    <div class="tag">${escape(site.tagline)}</div>
  </div>
  <div class="tables">
    <div class="t"><div>customers</div><div>id</div><div class="ren"><s>name</s>full_name</div><div>city</div></div>
    <div class="t v"><div>orders</div><div>id</div><div>customer_id</div><div>placed_at</div></div>
  </div>
  <div class="meta">${escape(site.term)}. Project proposal stage.</div>
</body></html>`;

const browser = await chromium.launch();
try {
  // Proposal PDF and its preview image.
  const html = proposalHtml(universityLogoDataUrl());
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: out('documents/schemamind-ai-project-proposal.pdf'),
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: false,
  });

  const preview = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 300 / 794 });
  await preview.setContent(
    html.replace(
      '<style>',
      '<style>body { padding: 94px 94px 0; box-sizing: border-box; height: 1123px; overflow: hidden; background: #fff; }',
    ),
    { waitUntil: 'load' },
  );
  await preview.screenshot({ path: out('documents/schemamind-ai-project-proposal-preview.png') });

  // Social preview image.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(ogHtml, { waitUntil: 'load' });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: out('og-image.png') });

  // Favicons.
  writeFileSync(out('favicon.svg'), faviconSvg);
  for (const [file, size] of [
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
  ]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } });
    const svg = faviconSvg.replace('<svg ', `<svg width="${size}" height="${size}" `);
    await icon.setContent(`<html><body style="margin:0;background:#0a1022">${svg}</body></html>`);
    await icon.screenshot({ path: out(file), omitBackground: false });
  }
} finally {
  await browser.close();
}

console.log('Assets written to public/.');
console.log('Proposal PDF bytes:', readFileSync(out('documents/schemamind-ai-project-proposal.pdf')).length);
