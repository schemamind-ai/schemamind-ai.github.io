// Project documents listed on the Documents page.
//
// To publish a new document:
//   1. Put the PDF in public/documents/ (lower-case, hyphenated file name).
//   2. Add an entry below. Only list documents that actually exist.
//   3. Run `npm run build && npm run verify`, then commit and push.
// The file size shown on the site is read from the PDF at build time.

export interface ProjectDocument {
  /** Unique, URL-safe identifier. */
  id: string;
  title: string;
  /** Course term the document belongs to. */
  term: string;
  summary: string;
  /** Path of the PDF under public/. */
  file: string;
  pages: number;
  /** Optional HTML version of the document on this site. */
  htmlPage?: string;
  /** Optional preview image under public/. */
  preview?: string;
  note?: string;
}

export const documents: ProjectDocument[] = [
  {
    id: 'project-proposal',
    title: 'Project Proposal',
    term: 'Fall 2026',
    summary:
      'Project name, team, supervisor, jury and the description of the proposed research on schema learning, LoRA and QLoRA fine-tuning, and schema changes.',
    file: '/documents/schemamind-ai-project-proposal.pdf',
    pages: 2,
    htmlPage: '/documents/proposal/',
    preview: '/documents/schemamind-ai-project-proposal-preview.png',
    note: 'Public copy. Student identification numbers have been removed; the project description is unchanged.',
  },
];

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
