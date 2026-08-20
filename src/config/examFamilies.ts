/**
 * Exam families — the site's primary category taxonomy for exam-prep and
 * professional-certification study communities.
 *
 * Categories (src/config/categories.ts) are derived from these families, so
 * adding/removing a family here updates category pages, navigation and
 * filters without touching templates.
 */
import type { CategorySlug, ExamSlug } from '../types/community';

export interface ExamFamilyConfig {
  slug: CategorySlug;
  name: string;
  /** Short, factual introduction shown on the family/category page. */
  description: string;
  /** Exam slugs canonically belonging to this family (see exams.ts). */
  exams: ExamSlug[];
  /** Tags (subcategories) under this family. Globally unique. */
  tags: string[];
}

export const examFamilies: ExamFamilyConfig[] = [
  {
    slug: 'college-admissions',
    name: 'College Admissions',
    description:
      'Study communities for undergraduate admissions tests such as the SAT, ACT and AP exams.',
    exams: ['sat', 'act', 'ap-exams', 'psat'],
    tags: ['SAT', 'ACT', 'AP Exams', 'PSAT', 'College Admissions'],
  },
  {
    slug: 'graduate-admissions',
    name: 'Graduate Admissions',
    description: 'Study communities for graduate admissions tests such as the GRE and GMAT.',
    exams: ['gre', 'gmat'],
    tags: ['GRE', 'GMAT', 'Graduate Admissions'],
  },
  {
    slug: 'entrance-exams',
    name: 'Entrance Exams',
    description:
      'Study communities for national and regional entrance exams such as JEE, NEET, GATE, CAT, CUET and UPSC.',
    exams: ['jee', 'neet', 'gate', 'cat', 'cuet', 'upsc'],
    tags: ['JEE', 'NEET', 'GATE', 'CAT', 'CUET', 'UPSC', 'Entrance Exams'],
  },
  {
    slug: 'english-proficiency',
    name: 'English Proficiency',
    description:
      'Study communities for English-language proficiency tests such as IELTS, TOEFL and PTE.',
    exams: ['ielts', 'toefl', 'pte-academic', 'cambridge-english', 'oet'],
    tags: ['IELTS', 'TOEFL', 'PTE Academic', 'Cambridge English', 'OET', 'English Tests'],
  },
  {
    slug: 'medical-healthcare',
    name: 'Medical & Healthcare',
    description:
      'Study communities for medical and healthcare exams such as MCAT, USMLE, NCLEX and PLAB.',
    exams: ['mcat', 'usmle', 'nclex', 'ucat', 'plab', 'oet-medicine', 'oet-nursing'],
    tags: ['MCAT', 'USMLE', 'NCLEX', 'UCAT', 'PLAB', 'Medical Exams', 'Nursing Exams'],
  },
  {
    slug: 'law',
    name: 'Law',
    description: 'Study communities for law school admissions and bar exams such as LSAT and SQE.',
    exams: ['lsat', 'bar-exam', 'sqe'],
    tags: ['LSAT', 'Bar Exam', 'SQE', 'Law School'],
  },
  {
    slug: 'finance-accounting',
    name: 'Finance & Accounting',
    description:
      'Study communities for finance and accounting certifications such as CFA, CPA and ACCA.',
    exams: ['cfa', 'cpa', 'acca', 'frm', 'cima', 'cma'],
    tags: ['CFA', 'CPA', 'ACCA', 'FRM', 'CIMA', 'CMA', 'Finance', 'Accounting'],
  },
  {
    slug: 'technology-certifications',
    name: 'Technology Certifications',
    description: 'General technology certification study communities and exam-support groups.',
    exams: [],
    tags: ['IT Certifications', 'Technology Exams', 'Certification Study'],
  },
  {
    slug: 'cybersecurity-certifications',
    name: 'Cybersecurity Certifications',
    description:
      'Study communities for cybersecurity certifications such as CompTIA Security+, CISSP and CEH.',
    exams: ['security-plus', 'comptia-a-plus', 'cissp', 'ceh', 'oscp', 'cysa-plus', 'pentest-plus'],
    tags: ['Security+', 'CompTIA A+', 'CISSP', 'CEH', 'OSCP', 'CySA+', 'PenTest+', 'Cybersecurity'],
  },
  {
    slug: 'cloud-certifications',
    name: 'Cloud Certifications',
    description:
      'Study communities for cloud certifications such as AWS, Microsoft Azure and Google Cloud.',
    exams: ['aws', 'azure', 'google-cloud'],
    tags: ['AWS', 'Azure', 'Google Cloud', 'Cloud Certifications'],
  },
  {
    slug: 'networking-certifications',
    name: 'Networking Certifications',
    description:
      'Study communities for networking certifications such as Cisco CCNA and CompTIA Network+.',
    exams: ['ccna', 'ccnp', 'network-plus'],
    tags: ['CCNA', 'CCNP', 'Network+', 'Cisco', 'Networking'],
  },
  {
    slug: 'project-management',
    name: 'Project Management',
    description:
      'Study communities for project management certifications such as PMP, CAPM and PRINCE2.',
    exams: ['pmp', 'capm', 'prince2', 'scrum-psm', 'csm'],
    tags: ['PMP', 'CAPM', 'PRINCE2', 'Scrum', 'PSM', 'CSM', 'Project Management'],
  },
  {
    slug: 'professional-licensing',
    name: 'Professional Licensing',
    description: 'Study communities for professional and occupational licensing exams.',
    exams: [],
    tags: ['Licensing Exams', 'Professional Exams', 'Licensure'],
  },
  {
    slug: 'general-study',
    name: 'General Study Communities',
    description:
      'Study communities without a single specific exam — study tips, accountability and exam strategy.',
    exams: [],
    tags: ['Study Tips', 'Accountability', 'Exam Strategy', 'Study Resources'],
  },
];

const familyBySlug = new Map<string, ExamFamilyConfig>(examFamilies.map((f) => [f.slug, f]));

export function getExamFamily(slug: string): ExamFamilyConfig | undefined {
  return familyBySlug.get(slug);
}

export function getExamFamilyName(slug: string): string {
  return getExamFamily(slug)?.name ?? slug;
}
