/**
 * Exam & certification registry — drives /exam/[slug]/ pages, discovery
 * query generation, classifier hints and filters.
 *
 * Only exams with real study-community demand belong here. `priority` only
 * shapes the DISCOVERY budget (high ≈ 70%, secondary ≈ 20%, experimental ≈
 * 10%) — it never decides publication.
 */
import type { TargetMarket } from '../types/community';
import type { CategorySlug } from '../types/community';

export interface ExamConfig {
  slug: string;
  name: string;
  /** Canonical family slug (examFamilies.ts). */
  family: CategorySlug;
  /** Short factual description for the exam page. */
  description: string;
  /** Keywords used by the classifier + relevance filter (lowercase). */
  keywords: string[];
  /** Market hints for QUERY TARGETING only — never auto-applied to listings. */
  queryMarkets?: TargetMarket[];
  priority: 'high' | 'secondary';
  /** Discovery query modifiers specific to this exam. */
  queryModifiers: string[];
}

export const exams: ExamConfig[] = [
  // --- College Admissions ---
  {
    slug: 'sat', name: 'SAT', family: 'college-admissions', priority: 'high',
    description: 'Study communities for the SAT college admissions test.',
    keywords: ['sat', 'sat prep', 'sat exam', 'sat study'],
    queryMarkets: ['US', 'global-english'],
    queryModifiers: ['study Discord', 'prep Discord', 'study group', 'Telegram study group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'act', name: 'ACT', family: 'college-admissions', priority: 'high',
    description: 'Study communities for the ACT college admissions test.',
    keywords: ['act', 'act prep', 'act exam', 'act study'],
    queryMarkets: ['US', 'global-english'],
    queryModifiers: ['study Discord', 'study group', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'ap-exams', name: 'AP Exams', family: 'college-admissions', priority: 'secondary',
    description: 'Study communities for Advanced Placement (AP) exams.',
    keywords: ['ap exam', 'ap exams', 'advanced placement', 'ap test'],
    queryMarkets: ['US', 'global-english'],
    queryModifiers: ['study group', 'review', 'discord', 'telegram'],
  },
  {
    slug: 'psat', name: 'PSAT', family: 'college-admissions', priority: 'secondary',
    description: 'Study communities for the PSAT/NMSQT.',
    keywords: ['psat', 'psat nmsqt', 'psat prep'],
    queryMarkets: ['US'],
    queryModifiers: ['study group', 'prep', 'practice'],
  },

  // --- Graduate Admissions ---
  {
    slug: 'gre', name: 'GRE', family: 'graduate-admissions', priority: 'high',
    description: 'Study communities for the GRE graduate admissions test.',
    keywords: ['gre', 'gre prep', 'gre exam', 'gre quant', 'gre verbal'],
    queryMarkets: ['global-english'],
    queryModifiers: ['Quant study group', 'study Discord', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'gmat', name: 'GMAT', family: 'graduate-admissions', priority: 'high',
    description: 'Study communities for the GMAT business school admissions test.',
    keywords: ['gmat', 'gmat prep', 'gmat focus', 'gmat exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study Discord', 'study group', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },

  // --- English Proficiency ---
  {
    slug: 'ielts', name: 'IELTS', family: 'english-proficiency', priority: 'high',
    description: 'Study communities for the IELTS English proficiency test.',
    keywords: ['ielts', 'ielts prep', 'ielts speaking', 'ielts writing', 'ielts listening'],
    queryMarkets: ['global-english'],
    queryModifiers: ['speaking practice group', 'writing practice group', 'Telegram study group', 'study Discord', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'toefl', name: 'TOEFL', family: 'english-proficiency', priority: 'high',
    description: 'Study communities for the TOEFL English proficiency test.',
    keywords: ['toefl', 'toefl prep', 'toefl ibt'],
    queryMarkets: ['global-english'],
    queryModifiers: ['speaking practice group', 'study Discord', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'pte-academic', name: 'PTE Academic', family: 'english-proficiency', priority: 'secondary',
    description: 'Study communities for the PTE Academic English test.',
    keywords: ['pte', 'pte academic', 'pte exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },
  {
    slug: 'cambridge-english', name: 'Cambridge English', family: 'english-proficiency', priority: 'secondary',
    description: 'Study communities for Cambridge English qualifications (FCE, CAE, CPE, B2 First).',
    keywords: ['cambridge english', 'fce', 'cae', 'cpe', 'b2 first', 'c1 advanced'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'exam preparation', 'discord'],
  },
  {
    slug: 'oet', name: 'OET', family: 'english-proficiency', priority: 'secondary',
    description: 'Study communities for the OET English test for healthcare professionals.',
    keywords: ['oet', 'oet exam', 'oet preparation'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },

  // --- Medical & Healthcare ---
  {
    slug: 'mcat', name: 'MCAT', family: 'medical-healthcare', priority: 'high',
    description: 'Study communities for the MCAT medical school admissions test.',
    keywords: ['mcat', 'mcat prep', 'mcat study'],
    queryMarkets: ['US', 'CA', 'global-english'],
    queryModifiers: ['study Discord', 'study group', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'usmle', name: 'USMLE', family: 'medical-healthcare', priority: 'high',
    description: 'Study communities for the USMLE medical licensing exams.',
    keywords: ['usmle', 'usmle step 1', 'usmle step 2', 'usmle step 3'],
    queryMarkets: ['US', 'global-english'],
    queryModifiers: ['Step 1 study group', 'Step 2 study group', 'Telegram study group', 'study Discord', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'nclex', name: 'NCLEX', family: 'medical-healthcare', priority: 'high',
    description: 'Study communities for the NCLEX nursing licensure exam.',
    keywords: ['nclex', 'nclex rn', 'nclex pn', 'nclex prep'],
    queryMarkets: ['US', 'CA', 'global-english'],
    queryModifiers: ['RN study group', 'study Discord', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'ucat', name: 'UCAT', family: 'medical-healthcare', priority: 'secondary',
    description: 'Study communities for the UCAT medical admissions test.',
    keywords: ['ucat', 'ucat prep', 'ucat exam'],
    queryMarkets: ['UK', 'AU', 'NZ'],
    queryModifiers: ['study group', 'discord', 'preparation'],
  },
  {
    slug: 'plab', name: 'PLAB', family: 'medical-healthcare', priority: 'secondary',
    description: 'Study communities for the PLAB medical licensing exam (UK).',
    keywords: ['plab', 'plab 1', 'plab 2'],
    queryMarkets: ['UK', 'global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },
  {
    slug: 'oet-medicine', name: 'OET Medicine', family: 'medical-healthcare', priority: 'secondary',
    description: 'OET English test communities for doctors.',
    keywords: ['oet medicine', 'oet for doctors'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },
  {
    slug: 'oet-nursing', name: 'OET Nursing', family: 'medical-healthcare', priority: 'secondary',
    description: 'OET English test communities for nurses.',
    keywords: ['oet nursing', 'oet for nurses'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },

  // --- Law ---
  {
    slug: 'lsat', name: 'LSAT', family: 'law', priority: 'high',
    description: 'Study communities for the LSAT law school admissions test.',
    keywords: ['lsat', 'lsat prep', 'lsat logic games', 'lsat study'],
    queryMarkets: ['US', 'CA', 'global-english'],
    queryModifiers: ['logic games study group', 'study Discord', 'Telegram study group', 'prep group', 'preparation Telegram', 'exam prep'],
  },
  {
    slug: 'bar-exam', name: 'Bar Exam', family: 'law', priority: 'secondary',
    description: 'Study communities for bar examinations.',
    keywords: ['bar exam', 'bar prep', 'bar examination'],
    queryMarkets: ['US', 'UK', 'CA'],
    queryModifiers: ['study group', 'prep', 'telegram'],
  },
  {
    slug: 'sqe', name: 'SQE', family: 'law', priority: 'secondary',
    description: 'Study communities for the Solicitors Qualifying Examination (UK).',
    keywords: ['sqe', 'sqe 1', 'sqe 2'],
    queryMarkets: ['UK', 'global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },

  // --- Finance & Accounting ---
  {
    slug: 'cfa', name: 'CFA', family: 'finance-accounting', priority: 'high',
    description: 'Study communities for the CFA charter exams.',
    keywords: ['cfa', 'cfa level 1', 'cfa level 2', 'cfa level 3', 'cfa exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['Level 1 study group', 'Level 2 study group', 'Telegram study group', 'study Discord', 'exam prep', 'certification study group'],
  },
  {
    slug: 'cpa', name: 'CPA', family: 'finance-accounting', priority: 'high',
    description: 'Study communities for the CPA licensure exam.',
    keywords: ['cpa exam', 'cpa study', 'cpa candidates', 'cpa prep'],
    queryMarkets: ['US', 'global-english'],
    queryModifiers: ['candidate study group', 'study Discord', 'Telegram study group', 'exam prep', 'preparation Telegram', 'certification study group'],
  },
  {
    slug: 'acca', name: 'ACCA', family: 'finance-accounting', priority: 'secondary',
    description: 'Study communities for ACCA accounting qualifications.',
    keywords: ['acca', 'acca exam', 'acca study'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'exam preparation'],
  },
  {
    slug: 'frm', name: 'FRM', family: 'finance-accounting', priority: 'secondary',
    description: 'Study communities for the FRM financial risk manager exam.',
    keywords: ['frm', 'frm exam', 'frm part 1', 'frm part 2'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },
  {
    slug: 'cima', name: 'CIMA', family: 'finance-accounting', priority: 'secondary',
    description: 'Study communities for CIMA management accounting qualifications.',
    keywords: ['cima', 'cima exam', 'cima study'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },
  {
    slug: 'cma', name: 'CMA', family: 'finance-accounting', priority: 'secondary',
    description: 'Study communities for the CMA certified management accountant exam.',
    keywords: ['cma exam', 'cma study', 'cma part 1', 'cma part 2'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'preparation'],
  },

  // --- Cloud Certifications ---
  {
    slug: 'aws', name: 'AWS Certifications', family: 'cloud-certifications', priority: 'high',
    description: 'Study communities for AWS certifications (Cloud Practitioner, Solutions Architect, Developer, SysOps).',
    keywords: ['aws certification', 'aws solutions architect', 'aws cloud practitioner', 'aws developer', 'aws sysops', 'saa-c03', 'clf-c02'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'Solutions Architect study group', 'Cloud Practitioner study group', 'Telegram study group', 'study Discord', 'exam prep'],
  },
  {
    slug: 'azure', name: 'Azure Certifications', family: 'cloud-certifications', priority: 'secondary',
    description: 'Study communities for Microsoft Azure certifications (AZ-900, AZ-104, AZ-305).',
    keywords: ['azure certification', 'az-900', 'az-104', 'az-305', 'azure administrator', 'azure solutions architect'],
    queryMarkets: ['global-english'],
    queryModifiers: ['certification', 'study group', 'az-104', 'exam prep'],
  },
  {
    slug: 'google-cloud', name: 'Google Cloud Certifications', family: 'cloud-certifications', priority: 'secondary',
    description: 'Study communities for Google Cloud certifications.',
    keywords: ['google cloud certification', 'gcp certification', 'gcp exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['certification', 'study group', 'exam prep'],
  },

  // --- Cybersecurity Certifications ---
  {
    slug: 'security-plus', name: 'CompTIA Security+', family: 'cybersecurity-certifications', priority: 'high',
    description: 'Study communities for the CompTIA Security+ certification (SY0-701).',
    keywords: ['security+', 'comptia security+', 'sy0-701', 'security plus'],
    queryMarkets: ['global-english'],
    queryModifiers: ['certification study group', 'SY0-701 study group', 'study Discord', 'Telegram study group', 'exam prep', 'preparation Telegram'],
  },
  {
    slug: 'comptia-a-plus', name: 'CompTIA A+', family: 'cybersecurity-certifications', priority: 'secondary',
    description: 'Study communities for the CompTIA A+ certification.',
    keywords: ['comptia a+', 'a+ certification', 'core 1', 'core 2'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'discord', 'certification prep'],
  },
  {
    slug: 'cissp', name: 'CISSP', family: 'cybersecurity-certifications', priority: 'high',
    description: 'Study communities for the CISSP certification.',
    keywords: ['cissp', 'cissp exam', 'cissp study'],
    queryMarkets: ['global-english'],
    queryModifiers: ['certification study group', 'study Discord', 'Telegram study group', 'exam prep', 'preparation Telegram', 'study group'],
  },
  {
    slug: 'ceh', name: 'CEH', family: 'cybersecurity-certifications', priority: 'secondary',
    description: 'Study communities for the CEH ethical hacking certification.',
    keywords: ['ceh', 'certified ethical hacker', 'ceh exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'exam prep'],
  },
  {
    slug: 'oscp', name: 'OSCP', family: 'cybersecurity-certifications', priority: 'secondary',
    description: 'Study communities for the OSCP penetration testing certification.',
    keywords: ['oscp', 'offensive security certified professional', 'oscp exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'discord', 'exam prep'],
  },
  {
    slug: 'cysa-plus', name: 'CySA+', family: 'cybersecurity-certifications', priority: 'secondary',
    description: 'Study communities for the CompTIA CySA+ certification.',
    keywords: ['cysa+', 'comptia cysa', 'cysa plus'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'certification prep'],
  },
  {
    slug: 'pentest-plus', name: 'PenTest+', family: 'cybersecurity-certifications', priority: 'secondary',
    description: 'Study communities for the CompTIA PenTest+ certification.',
    keywords: ['pentest+', 'comptia pentest+'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'certification prep'],
  },

  // --- Networking Certifications ---
  {
    slug: 'ccna', name: 'CCNA', family: 'networking-certifications', priority: 'high',
    description: 'Study communities for the Cisco CCNA certification.',
    keywords: ['ccna', 'ccna 200-301', 'ccna study', 'cisco certification'],
    queryMarkets: ['global-english'],
    queryModifiers: ['certification study group', 'study Discord', 'Telegram study group', 'exam prep', 'preparation Telegram', 'study group'],
  },
  {
    slug: 'ccnp', name: 'CCNP', family: 'networking-certifications', priority: 'secondary',
    description: 'Study communities for Cisco CCNP certifications.',
    keywords: ['ccnp', 'ccnp enterprise', 'ccnp exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'exam prep'],
  },
  {
    slug: 'network-plus', name: 'CompTIA Network+', family: 'networking-certifications', priority: 'secondary',
    description: 'Study communities for the CompTIA Network+ certification.',
    keywords: ['network+', 'comptia network+', 'network plus'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'certification study'],
  },

  // --- Project Management ---
  {
    slug: 'pmp', name: 'PMP', family: 'project-management', priority: 'high',
    description: 'Study communities for the PMP project management certification.',
    keywords: ['pmp', 'pmp exam', 'pmp study', 'project management professional'],
    queryMarkets: ['global-english'],
    queryModifiers: ['certification study group', 'study Discord', 'Telegram study group', 'exam prep', 'preparation Telegram', 'study group'],
  },
  {
    slug: 'capm', name: 'CAPM', family: 'project-management', priority: 'secondary',
    description: 'Study communities for the CAPM certification.',
    keywords: ['capm', 'capm exam'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'exam prep'],
  },
  {
    slug: 'prince2', name: 'PRINCE2', family: 'project-management', priority: 'secondary',
    description: 'Study communities for PRINCE2 certifications.',
    keywords: ['prince2', 'prince2 foundation', 'prince2 practitioner'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'telegram', 'exam prep'],
  },
  {
    slug: 'scrum-psm', name: 'Scrum PSM', family: 'project-management', priority: 'secondary',
    description: 'Study communities for Scrum.org PSM certifications.',
    keywords: ['psm i', 'psm ii', 'professional scrum master'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'exam prep'],
  },
  {
    slug: 'csm', name: 'CSM', family: 'project-management', priority: 'secondary',
    description: 'Study communities for the Certified ScrumMaster (CSM) certification.',
    keywords: ['csm', 'certified scrum master'],
    queryMarkets: ['global-english'],
    queryModifiers: ['study group', 'exam prep'],
  },
];

const examBySlug = new Map<string, ExamConfig>(exams.map((e) => [e.slug, e]));

export function getExam(slug: string): ExamConfig | undefined {
  return examBySlug.get(slug);
}

export function getExamName(slug: string): string {
  return getExam(slug)?.name ?? slug;
}

/** Exams by priority tier, stable order. */
export function getExamsByPriority(): Record<'high' | 'secondary', ExamConfig[]> {
  return {
    high: exams.filter((e) => e.priority === 'high'),
    secondary: exams.filter((e) => e.priority === 'secondary'),
  };
}
