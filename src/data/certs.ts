// GIAC record: https://www.giac.org/certified-professional/Jake-Bushnell/186575
// Status is derived from the expiry date when the site is built.

export interface Cert {
  code: string;
  name: string;
  analyst: number;
  obtained: string; // YYYY-MM-DD
  expires: string; // YYYY-MM-DD
}

export const certs: Cert[] = [
  { code: 'GCPN', name: 'GIAC Cloud Penetration Tester', analyst: 2429, obtained: '2026-04-07', expires: '2030-04-30' },
  { code: 'GRTP', name: 'GIAC Red Team Professional', analyst: 495, obtained: '2025-03-07', expires: '2029-03-31' },
  { code: 'GWEB', name: 'GIAC Certified Web Application Defender', analyst: 1409, obtained: '2023-09-25', expires: '2027-09-30' },
  { code: 'GPYC', name: 'GIAC Python Coder', analyst: 2004, obtained: '2023-06-09', expires: '2027-06-30' },
  { code: 'GISF', name: 'GIAC Information Security Fundamentals', analyst: 6483, obtained: '2023-03-10', expires: '2027-03-31' },
  { code: 'GPEN', name: 'GIAC Penetration Tester', analyst: 17722, obtained: '2022-09-23', expires: '2026-09-30' },
  { code: 'GWAPT', name: 'GIAC Web Application Penetration Tester', analyst: 9245, obtained: '2022-02-25', expires: '2026-02-28' },
  { code: 'GFACT', name: 'GIAC Foundational Cybersecurity Technologies', analyst: 123, obtained: '2021-07-23', expires: '2025-07-31' },
  { code: 'GCIA', name: 'GIAC Certified Intrusion Analyst', analyst: 14787, obtained: '2020-10-31', expires: '2024-10-31' },
  { code: 'GCIH', name: 'GIAC Certified Incident Handler', analyst: 37513, obtained: '2020-06-13', expires: '2024-06-30' },
  { code: 'GSEC', name: 'GIAC Security Essentials', analyst: 47056, obtained: '2020-02-27', expires: '2024-02-29' },
];

export const isActive = (c: Cert, now = new Date()) => new Date(`${c.expires}T23:59:59Z`) >= now;

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
export const formatMonth = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`));
