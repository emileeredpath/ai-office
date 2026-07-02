// Shared styles, constants, and types for the living office

export const OFFICE_COLORS = {
  floorWood: '#A68560',
  floorLight: '#B89570',
  wallWarm: '#E8DCC8',
  wallMid: '#DCC8B8',
  deskWood: '#8B6F47',
  deskLight: '#A0826D',
  accentWarm: '#D4A574',
};

export const EMPLOYEE_ROLES = [
  'marketing-director',
  'website-auditor',
  'seo-ppc-manager',
  'email-marketing-manager',
  'proposal-writer',
  'social-media-manager',
  'case-study-writer',
  'funding-rewards-manager',
];

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'marketing-director': 'Marketing Director',
  'website-auditor': 'Website Manager',
  'seo-ppc-manager': 'SEO & PPC Manager',
  'email-marketing-manager': 'Email Marketing Manager',
  'proposal-writer': 'Proposal Writer',
  'social-media-manager': 'Social Media Manager',
  'case-study-writer': 'Case Study Writer',
  'funding-rewards-manager': 'Funding & Rewards Manager',
};

// Office layout grid positions (percentage-based)
export const DESK_POSITIONS = [
  // Left side
  { employeeId: 'marketing-director', x: 12, y: 25 },
  { employeeId: 'social-media-manager', x: 12, y: 60 },

  // Center-left
  { employeeId: 'seo-ppc-manager', x: 28, y: 30 },
  { employeeId: 'proposal-writer', x: 28, y: 65 },

  // Center
  { employeeId: 'email-marketing-manager', x: 50, y: 65 },

  // Center-right
  { employeeId: 'website-auditor', x: 72, y: 30 },
  { employeeId: 'case-study-writer', x: 72, y: 65 },

  // Right side
  { employeeId: 'funding-rewards-manager', x: 88, y: 60 },
];
