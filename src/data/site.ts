// Project facts shown across the site. Keep these in sync with the proposal.

export const site = {
  name: 'SchemaMind AI',
  tagline: 'Can language models learn database schemas?',
  description:
    'SchemaMind AI is a TED University senior research project investigating how much knowledge of an SQL database schema a language model can learn through fine-tuning, and how that knowledge holds up when the database changes.',
  university: 'TED University',
  faculty: 'Faculty of Engineering',
  departments: 'Departments of Computer & Software Engineering',
  course: 'CMPE 491 / SENG 491 Senior Project',
  term: 'Fall 2026',
  phase: 'Project Proposal',
  url: 'https://schemamind-ai.github.io/',
  repository: 'https://github.com/schemamind-ai/schemamind-ai.github.io',
} as const;

/** Section anchors on the home page, in reading order. */
export const sections = [
  { id: 'about', label: 'About' },
  { id: 'research-questions', label: 'Research questions' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'evaluation', label: 'Evaluation' },
  { id: 'documents', label: 'Documents' },
  { id: 'team', label: 'Team' },
] as const;
