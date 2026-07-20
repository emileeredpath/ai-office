// MTech AI Office - The 8 Core Employees (plus Sandy)

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'waiting' | 'blocked';
  currentTask?: string;
  workload: number; // 0-100
  area: string; // Office location
  emoji: string;
}

export const EMPLOYEES: Record<string, Employee> = {
  sandy: {
    id: 'sandy',
    name: 'Sandy',
    role: 'Chief of Staff',
    status: 'available',
    workload: 85,
    area: 'Executive Office',
    emoji: '🤖',
  },
  email_manager: {
    id: 'email_manager',
    name: 'Email Marketing Manager',
    role: 'Campaigns & Newsletters',
    status: 'busy',
    currentTask: 'Account Manager Email Programme',
    workload: 75,
    area: 'Marketing Department',
    emoji: '📧',
  },
  website_manager: {
    id: 'website_manager',
    name: 'Website Manager',
    role: 'Page Creation & Updates',
    status: 'busy',
    currentTask: 'Radio Systems New Page',
    workload: 65,
    area: 'Content Team',
    emoji: '🌐',
  },
  seo_ppc_manager: {
    id: 'seo_ppc_manager',
    name: 'SEO & PPC Manager',
    role: 'Search & Google Ads',
    status: 'available',
    workload: 45,
    area: 'Digital Marketing',
    emoji: '📊',
  },
  social_media_manager: {
    id: 'social_media_manager',
    name: 'Social Media Manager',
    role: 'LinkedIn, Facebook, Instagram, TikTok',
    status: 'available',
    workload: 30,
    area: 'Social Media Department',
    emoji: '📱',
  },
  proposal_writer: {
    id: 'proposal_writer',
    name: 'Proposal Writer',
    role: 'Tenders & RFP Responses',
    status: 'available',
    workload: 50,
    area: 'Business Development',
    emoji: '✍️',
  },
  case_study_writer: {
    id: 'case_study_writer',
    name: 'Case Study Writer',
    role: 'Customer Stories & Testimonials',
    status: 'available',
    workload: 40,
    area: 'Content Strategy',
    emoji: '📖',
  },
  funding_manager: {
    id: 'funding_manager',
    name: 'Funding & Rewards Manager',
    role: 'Grants & Supplier Co-op',
    status: 'available',
    workload: 35,
    area: 'Finance Department',
    emoji: '💰',
  },
};

export const BRANDS = {
  mtech: {
    id: 'mtech',
    name: 'MTech',
    website: '',
    shortName: 'MTech',
  },
  brentwood: {
    id: 'brentwood',
    name: 'MTech Brentwood Communications',
    website: 'brentwoodradios.co.uk',
    shortName: 'Brentwood',
  },
  radio_links: {
    id: 'radio_links',
    name: 'MTech Radio Links',
    website: 'radio-links.co.uk',
    shortName: 'Radio Links',
  },
  capcom: {
    id: 'capcom',
    name: 'Capcom',
    website: 'capcom.co.uk',
    shortName: 'Capcom',
  },
  ircl: {
    id: 'ircl',
    name: 'IRCL',
    website: 'ircl.ie',
    shortName: 'IRCL',
  },
};

// Brand order for filters: All Brands · MTech · Brentwood · Radio Links · Capcom · IRCL
export const BRAND_ORDER = ['mtech', 'brentwood', 'radio_links', 'capcom', 'ircl'] as const;

export type BrandId = keyof typeof BRANDS;
export type EmployeeId = keyof typeof EMPLOYEES;

// Real MTech task data (from Section 11 of the brief)
export interface Task {
  id: string;
  title: string;
  brand: BrandId;
  owner?: EmployeeId;
  status: 'backlog' | 'assigned' | 'in-progress' | 'waiting-review' | 'waiting-approval' | 'waiting-john' | 'waiting-customer' | 'blocked' | 'complete';
  priority: 'high' | 'medium' | 'low';
  deadline?: string; // ISO date
  context: string; // e.g., "Account Manager: Sue Gunnell"
  createdAt: string; // ISO date
}

export const REAL_TASKS: Task[] = [
  // Email Campaigns
  {
    id: 'task-1',
    title: "Martyn's Law — General Email Post",
    brand: 'brentwood',
    owner: 'email_manager',
    status: 'backlog',
    priority: 'high',
    context: 'Brentwood',
    createdAt: '2026-07-15',
  },
  {
    id: 'task-2',
    title: 'Account Manager Email — Sue Gunnell',
    brand: 'brentwood',
    owner: 'email_manager',
    status: 'complete',
    priority: 'high',
    context: 'Brentwood',
    createdAt: '2026-07-10',
  },
  {
    id: 'task-3',
    title: 'Account Manager Email — Sateen Baxter',
    brand: 'radio_links',
    owner: 'email_manager',
    status: 'waiting-john',
    priority: 'high',
    context: 'Radio Links',
    createdAt: '2026-07-12',
  },
  {
    id: 'task-4',
    title: 'Account Manager Email — Matt Ellwood-Smith',
    brand: 'radio_links',
    owner: 'email_manager',
    status: 'in-progress',
    priority: 'high',
    context: 'Radio Links',
    createdAt: '2026-07-14',
  },
  {
    id: 'task-5',
    title: 'Account Manager Email — Matt Ellwood-Smith',
    brand: 'capcom',
    owner: 'email_manager',
    status: 'in-progress',
    priority: 'medium',
    context: 'Capcom',
    createdAt: '2026-07-14',
  },
  {
    id: 'task-6',
    title: 'Account Manager Email — Alex Bacon',
    brand: 'brentwood',
    owner: 'email_manager',
    status: 'in-progress',
    priority: 'medium',
    context: 'Brentwood',
    createdAt: '2026-07-14',
  },
  {
    id: 'task-7',
    title: 'Account Manager Email — Garreth Breen',
    brand: 'ircl',
    owner: 'email_manager',
    status: 'in-progress',
    priority: 'medium',
    context: 'IRCL',
    createdAt: '2026-07-14',
  },
  {
    id: 'task-8',
    title: 'YESSS Electrical — Lydia Lacey',
    brand: 'brentwood',
    owner: 'email_manager',
    status: 'complete',
    priority: 'medium',
    context: 'Brentwood',
    createdAt: '2026-07-08',
  },
  {
    id: 'task-9',
    title: 'Vistry — Lydia Lacey',
    brand: 'brentwood',
    owner: 'email_manager',
    status: 'complete',
    priority: 'medium',
    context: 'Brentwood',
    createdAt: '2026-07-08',
  },
  {
    id: 'task-10',
    title: 'S1 Minis Campaign',
    brand: 'brentwood',
    owner: 'email_manager',
    status: 'backlog',
    priority: 'medium',
    context: 'Brentwood',
    createdAt: '2026-07-15',
  },

  // Websites
  {
    id: 'task-11',
    title: 'Two-Way Radios Landing Page',
    brand: 'brentwood',
    owner: 'website_manager',
    status: 'assigned',
    priority: 'high',
    context: 'Paused (dev team)',
    createdAt: '2026-07-01',
  },
  {
    id: 'task-12',
    title: 'Radio Systems New Page',
    brand: 'brentwood',
    owner: 'website_manager',
    status: 'in-progress',
    priority: 'high',
    context: 'Brentwood',
    createdAt: '2026-07-12',
  },
  {
    id: 'task-13',
    title: 'BC Home Page — Reword + Banners',
    brand: 'brentwood',
    owner: 'website_manager',
    status: 'complete',
    priority: 'high',
    context: 'Banner live',
    createdAt: '2026-07-05',
  },
  {
    id: 'task-14',
    title: 'Two-Way Radios Product Cards',
    brand: 'brentwood',
    owner: 'website_manager',
    status: 'assigned',
    priority: 'medium',
    context: 'Brief ready',
    createdAt: '2026-07-13',
  },
  {
    id: 'task-15',
    title: 'Capcom Website Banner',
    brand: 'capcom',
    owner: 'website_manager',
    status: 'backlog',
    priority: 'medium',
    context: 'Capcom',
    createdAt: '2026-07-15',
  },

  // SEO & PPC
  {
    id: 'task-16',
    title: 'Review PPC Ads — Correct Messaging',
    brand: 'brentwood',
    owner: 'seo_ppc_manager',
    status: 'assigned',
    priority: 'high',
    deadline: '2026-07-25',
    context: 'Meeting Thursday',
    createdAt: '2026-07-18',
  },
  {
    id: 'task-17',
    title: 'PPC Campaign Restructure — Phase 1 Build',
    brand: 'brentwood',
    owner: 'seo_ppc_manager',
    status: 'in-progress',
    priority: 'high',
    deadline: '2026-07-25',
    context: 'Brentwood',
    createdAt: '2026-07-10',
  },

  // Social Media
  {
    id: 'task-18',
    title: "Martyn's Law — General Social Post",
    brand: 'brentwood',
    owner: 'social_media_manager',
    status: 'backlog',
    priority: 'medium',
    context: 'Brentwood',
    createdAt: '2026-07-15',
  },
  {
    id: 'task-19',
    title: 'HSBC Social Posts',
    brand: 'brentwood',
    owner: 'social_media_manager',
    status: 'backlog',
    priority: 'medium',
    context: 'Brentwood',
    createdAt: '2026-07-15',
  },

  // Case Studies
  {
    id: 'task-20',
    title: 'Duke of York Case Study',
    brand: 'brentwood',
    owner: 'case_study_writer',
    status: 'complete',
    priority: 'high',
    context: 'With Lydia',
    createdAt: '2026-07-01',
  },
  {
    id: 'task-21',
    title: 'Case Study Spreadsheet — Keep Up to Date',
    brand: 'brentwood',
    status: 'in-progress',
    priority: 'low',
    context: 'All brands',
    createdAt: '2026-06-01',
  },
  {
    id: 'task-22',
    title: 'Rebrand Case Studies — MTech Branding',
    brand: 'brentwood',
    owner: 'case_study_writer',
    status: 'backlog',
    priority: 'medium',
    context: 'All brands',
    createdAt: '2026-07-15',
  },

  // Branding
  {
    id: 'task-23',
    title: 'IRCL Stickers, Leaflets, MTech Tape',
    brand: 'ircl',
    status: 'waiting-john',
    priority: 'high',
    context: 'With John',
    createdAt: '2026-07-10',
  },
  {
    id: 'task-24',
    title: 'Hire Stickers — James Smart',
    brand: 'brentwood',
    status: 'complete',
    priority: 'low',
    context: 'Brentwood',
    createdAt: '2026-07-08',
  },
  {
    id: 'task-25',
    title: 'VoCoVo Pricing Update',
    brand: 'brentwood',
    status: 'complete',
    priority: 'low',
    context: 'Brentwood',
    createdAt: '2026-07-08',
  },
];
