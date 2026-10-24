# SchemaMind AI website

Source of the website of **SchemaMind AI**, a CMPE 491 / SENG 491 senior project at TED University (Fall 2026).

Live site: <https://schemamind-ai.github.io/>

The site is static. It is built with [Astro](https://astro.build/) and TypeScript, and deployed to GitHub Pages by GitHub Actions on every push to `main`. It has no backend, no analytics, no cookies and no external requests at runtime (fonts are self-hosted).

## Requirements

- Node.js 24 or newer (see `.nvmrc`)
- npm

## Local development

```sh
npm ci                      # install the exact dependency versions
npm run dev                 # development server at http://localhost:4321
```

## Checks

Run all of these before publishing. Once enabled, the deployment workflow runs the same checks and will not publish if any fail.

```sh
npm run check               # TypeScript and Astro type check
npm run build               # production build into dist/
npm run verify              # privacy, claims and internal-link scan of dist/
python3 -m pip install pypdf      # first time only
python3 scripts/check-pdfs.py dist   # checks published PDFs for ID numbers and e-mail addresses
npx playwright install chromium   # first time only
npm test                    # end-to-end tests (desktop, tablet, mobile)
```

Optional:

```sh
WEBKIT=1 npm test           # also test Safari's engine (run `npx playwright install webkit` first)
BASE_URL=https://schemamind-ai.github.io npm test   # test the live site
SCREENSHOTS=1 npx playwright test screenshots      # save review screenshots to test-results/screens/
```

## Project structure

```
src/
  data/          site facts, team, documents, proposal text  <- most content edits happen here
  components/    header, footer, section layout, schema figure, document card, badges
  layouts/       page shell with metadata
  pages/         index (home), documents/, documents/proposal, 404, sitemap.xml
  styles/        global.css with the colour, type and spacing tokens
public/
  documents/     published PDFs and their preview images
  og-image.png, favicon.svg, favicon-32.png, apple-touch-icon.png, robots.txt
scripts/
  build-assets.mjs   regenerates the proposal PDF, preview, social image and icons
  verify-dist.mjs    checks the build for private data and unsupported claims
  check-pdfs.py      checks published PDFs for private data
  serve-dist.mjs     static server used by the tests
tests/           Playwright tests
deploy/          GitHub Actions workflow, ready to move to .github/workflows/
```

## Updating the website

### Publish a new report

1. Export the report to PDF. **Remove student numbers, phone numbers, personal e-mail addresses and any other private data first.**
2. Save it as `public/documents/<short-hyphenated-name>.pdf` (keep it under 5 MB).
3. Add an entry to `src/data/documents.ts` with its title, term, summary, file path and page count. List only documents that exist.
4. Run the checks above, then commit and push to `main`. The site updates automatically within a few minutes.

### Change text on the home page

Edit `src/pages/index.astro`. Shared facts (course, term, phase, URL) are in `src/data/site.ts`; names are in `src/data/people.ts`.

Content rules for this project:

- Every statement must be supported by the project proposal or a later approved report.
- Mark work as **Planned** or **Under consideration** until it is actually done. Do not describe results that do not exist.
- Write names exactly as in the proposal. Do not use CSS `text-transform` on names (it breaks Turkish letters such as İ).
- Do not add photos, contact details or student numbers without the person's consent.

### Add results later

When experiments are complete, replace the "Results" placeholder in the Evaluation section of `src/pages/index.astro`, or move results to a new page under `src/pages/` and link it from the header (`src/components/SiteHeader.astro`). Update `site.phase` in `src/data/site.ts` when the project phase changes.

### Regenerate the public proposal PDF

`npm run assets` rebuilds `public/documents/schemamind-ai-project-proposal.pdf`, its preview image, the social preview image and the icons. The proposal text comes from `src/data/`, which contains no student numbers. The script reads the university logo from the original proposal one folder above this repository (`../Senior Project Proposal*.docx`) if that file is present; the original is never modified or copied into the repository.

## Deployment

### Current mode: deploy from the `gh-pages` branch

The site is currently published from the `gh-pages` branch, which contains only the built `dist/` output (plus an empty `.nojekyll` file). Repository settings: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / root**.

To publish a change, run the checks above, push `main`, then publish the build:

```sh
npm run build && npm run verify && python3 scripts/check-pdfs.py dist && npm test
git worktree add ../gh-pages-publish gh-pages
rsync -a --delete --exclude .git dist/ ../gh-pages-publish/
touch ../gh-pages-publish/.nojekyll
git -C ../gh-pages-publish add -A
git -C ../gh-pages-publish commit -m "Publish site"
git -C ../gh-pages-publish push origin gh-pages
git worktree remove ../gh-pages-publish
```

GitHub Pages updates within a few minutes.

### Enabling automatic deployment (recommended)

`deploy/github-pages-workflow.yml` is a ready GitHub Actions workflow that type-checks, builds, verifies and tests the site, then deploys it on every push to `main`. It is stored outside `.github/workflows/` because pushing workflow files requires the `workflow` permission on the publishing account. To enable it, an organization owner:

1. Opens <https://github.com/schemamind-ai/schemamind-ai.github.io/new/main?filename=.github/workflows/deploy.yml>, pastes the contents of `deploy/github-pages-workflow.yml`, and commits it to `main`.
2. Sets **Settings → Pages → Source** to **GitHub Actions**.

From then on every push to `main` is tested and deployed automatically, and the `gh-pages` branch is no longer needed. To roll back, revert the commit on `main`.

## Team

Project team: Namık Batın GAMBAZ, Ömer Buğra KESKİN, Berke MERT. Supervisor: Tansel DÖKEROĞLU. Jury: Kasım Murat KARAKAYA, Deniz CANTÜRK.

This is a student project website. It is not an official TED University page.
