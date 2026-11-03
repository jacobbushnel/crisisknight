// Single source for site copy. Anything still unconfirmed contains "TODO:".
// Find leftovers before launch with: grep -rn "TODO:" src public

export const site = {
  name: 'CrisisKnight',
  owner: 'Jacob Bushnell',
  url: 'https://crisisknight.com',
  tagline: 'Security practitioner for application, cloud and red team engagements.',
  intro:
    'Independent penetration tester available to subcontract with security consultancies. Background in application development, which shapes how I test and how I write up findings.',
};

export const links = {
  linkedin: 'https://www.linkedin.com/in/jacob-bushnell/',
  github: 'https://github.com/jacobbushnel',
  giac: 'https://www.giac.org/certified-professional/Jake-Bushnell/186575',
};

export const bio = [
  'TODO: two or three sentences about you: background, what you focus on, how you like to work with firms.',
];

// Draft copy derived from your certifications. Edit freely.
export const services = [
  {
    title: 'Web application testing',
    body: 'Manual-led testing of web apps and APIs against the OWASP Top 10 and business logic, with reproducible findings and developer-ready remediation.',
  },
  {
    title: 'Cloud penetration testing',
    body: 'Assessment of cloud environments for identity, configuration and privilege-escalation weaknesses.',
  },
  {
    title: 'Red team and adversary simulation',
    body: 'Objective-based engagements that exercise detection and response, delivered as part of a larger team.',
  },
];

export const experience: {
  role: string;
  org: string;
  period: string;
  summary: string;
}[] = [
  {
    role: 'TODO: role title',
    org: 'TODO: employer or "Independent"',
    period: 'TODO: 20XX to present',
    summary: 'TODO: engagement types, focus areas and outcomes. Omit client names covered by NDA.',
  },
];
