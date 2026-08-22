# POST-DOMAIN ON-PAGE SEO & PRODUCTION INTEGRITY VERIFICATION REPORT

**Project:** StudyGroupsHub  
**Production Domain:** https://studygroupshub.com/  
**Legacy Netlify Hostname:** https://groupscout.netlify.app/  
**Repository:** https://github.com/jibranpcccc/groupscout  
**Audit Date:** 2026-08-22  

---

## 1. Executive Summary

Following the custom domain migration (studygroupshub.com) and complete rebrand overhaul, this post-domain verification audit proves that StudyGroupsHub is in a fully verified, content-clean, and technically optimized production state.

### Key Milestones Verified:
1. **0 Stale Brand / Stale Host Occurrences:** Automated permanent guards in scripts/audit/seoAudit.ts verify 0 public occurrences of StudyScout, groupscout.netlify.app, localhost:4321, or 127.0.0.1 across all 267 generated HTML files, canonicals, Open Graph tags, JSON-LD blocks, and obots.txt.
2. **0 Exact Duplicate Narrative Paragraphs:** A pairwise similarity audit across all 15 indexable exam hubs (udit/exam-hub-content-similarity.json) confirmed 0 duplicate substantive paragraphs, providing unique vertical preparation guidance and distinct FAQs for each exam.
3. **Truthful & Inventory-Aware Platform Guidance:** Exam hubs dynamically render platform advice based on authentic inventory (e.g. exams with only Telegram do not display comparative Discord sections).
4. **Dynamic Platform Indexability:** Dynamic threshold logic (PLATFORM_INDEX_MIN = 5) ensures platforms without sufficient published communities (WhatsApp with 0 listings) remain non-indexable, while Telegram (145) and Discord (9) remain indexable, supported by automated unit tests in 	ests/platform-indexability.test.ts.
5. **Mobile Lighthouse Scores (Median Performance 98, Accessibility 96, Best Practices 92, SEO 100):** Real lab audits across the homepage, directory, exam hubs, category hubs, platform hubs, and detail pages confirmed top-tier performance.
6. **GA4 Analytics (G-553LRP3Z7R):** Properly integrated with exactly 1 loader per page across all public routes.
7. **Full Quality Suite:** 19 test files (238 unit tests), schema validation, static build (267 pages), and SEO audit passed with 100% exit code 0.

---

## 2. Remote Head & Environment State

- **Starting Remote Main SHA:** 3e8b6a615eb18c87b55dd424f1bf65e2c34dac9
- **Total Published Listings:** 154 (145 Telegram, 9 Discord, 0 WhatsApp)
- **Total Generated HTML Routes:** 267
- **Total Indexable Routes in Sitemap:** 71
- **Total Non-Indexable Utility / Thin Routes:** 196

---

## 3. Stale Brand & Stale Domain Cleanliness Matrix

| Metric | Target | Result | Status |
| :--- | :---: | :---: | :---: |
| StudyScout occurrences in built HTML | 0 | 0 | PASSED |
| groupscout.netlify.app in public canonicals | 0 | 0 | PASSED |
| localhost / 127.0.0.1 in public tags / sitemaps | 0 | 0 | PASSED |
| Forbidden FAQPage JSON-LD schema | 0 | 0 | PASSED |
| Public gibberish / placeholder text | 0 | 0 | PASSED |

Automated regression guards are permanently integrated into scripts/audit/seoAudit.ts (
pm run seo:audit).

---

## 4. Homepage Metadata & Content Claims

- **Page Title:** Study Groups for IELTS, USMLE, SAT & Certifications | StudyGroupsHub
- **H1:** Find Exam & Certification Study Groups
- **Canonical URL:** https://studygroupshub.com/
- **Open Graph Site Name:** StudyGroupsHub
- **Twitter Card:** summary_large_image
- **JSON-LD Structured Data:**
  - WebSite (
ame: "StudyGroupsHub", url: "https://studygroupshub.com/", SearchAction)
  - Organization (
ame: "StudyGroupsHub", url: "https://studygroupshub.com/", logo: "https://studygroupshub.com/images/og-default.svg")
- **Content Claims:** Truthful phrasing distinguishing listed communities, verified active links, and transparent community reporting.

---

## 5. 15 Indexable Exam Hubs Inventory & Platform Matrix

| Exam | Family | Total Listings | Telegram | Discord | WhatsApp | Indexable Details | Source-Confirmed | Unverified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **IELTS** | english-proficiency | 22 | 22 | 0 | 0 | 3 | 15 | 7 |
| **UPSC** | entrance-exams | 14 | 14 | 0 | 0 | 5 | 7 | 7 |
| **JEE** | entrance-exams | 13 | 13 | 0 | 0 | 4 | 9 | 4 |
| **NEET** | medical-healthcare | 13 | 12 | 1 | 0 | 6 | 9 | 4 |
| **SAT** | college-admissions | 13 | 11 | 2 | 0 | 4 | 5 | 8 |
| **USMLE** | medical-healthcare | 12 | 12 | 0 | 0 | 1 | 6 | 6 |
| **NCLEX** | medical-healthcare | 11 | 11 | 0 | 0 | 2 | 6 | 5 |
| **TOEFL** | english-proficiency | 10 | 10 | 0 | 0 | 6 | 8 | 2 |
| **GRE** | graduate-admissions | 9 | 9 | 0 | 0 | 7 | 9 | 0 |
| **LSAT** | law-school | 8 | 7 | 1 | 0 | 1 | 3 | 5 |
| **CFA** | accounting-finance | 7 | 7 | 0 | 0 | 2 | 5 | 2 |
| **GMAT** | graduate-admissions | 6 | 5 | 1 | 0 | 2 | 4 | 2 |
| **GATE** | entrance-exams | 6 | 6 | 0 | 0 | 2 | 3 | 3 |
| **CPA** | accounting-finance | 6 | 6 | 0 | 0 | 0 | 3 | 3 |
| **CISSP** | it-certifications | 5 | 5 | 0 | 0 | 0 | 1 | 4 |

---

## 6. Exam Hub Narrative & Similarity Audit

- **Script:** scripts/audit/auditExamSimilarity.ts
- **Output Artifact:** udit/exam-hub-content-similarity.json
- **Total Pairs Compared:** 105 pairwise comparisons across 15 indexable hubs
- **Exact Duplicate Substantive Paragraphs:** **0**
- **High-Similarity Pairs Requiring Manual Review (>0.75):** **0**

Every indexable exam hub includes:
1. Four exam-specific preparation focus bullet points (src/config/examGuidance.ts).
2. Truthful, inventory-aware platform advice tailored to actual community availability.
3. Four unique, exam-specific FAQ questions and answers.

---

## 7. Dynamic Platform Indexability

- **Threshold Constant:** PLATFORM_INDEX_MIN = 5 in src/config/discovery.ts and stro.config.mjs.
- **Platform Hub Status:**
  - 	elegram (145 listings) ? Indexable (sitemap included, 
oindex: false)
  - discord (9 listings) ? Indexable (sitemap included, 
oindex: false)
  - whatsapp (0 listings) ? Non-indexable (sitemap excluded, 
oindex: true)
- **Automated Tests:** 	ests/platform-indexability.test.ts verified 6 unit tests covering 0, 4, 5, and custom threshold scenarios.

---

## 8. Title, Meta Description & Canonical Audit (71 Indexable Routes)

- **Total Indexable Routes:** 71
- **Duplicate Titles:** 0
- **Duplicate Meta Descriptions:** 0
- **Canonical Consistency:** 100% resolve to https://studygroupshub.com/...
- **Structure Breakdown:**
  - Core Static Pages: 6 (/, /communities/, /how-we-verify/, /privacy/, /safety/, /terms/)
  - Category Hubs: 8 (/category/*/)
  - Platform Hubs: 2 (/platform/telegram/, /platform/discord/)
  - Exam Hubs: 15 (/exam/*/)
  - High-Quality Detail Pages: 35 (/group/*/)

---

## 9. Live Domain & Redirect Matrix

| Inbound URL | Effective Final URL | HTTP Status | Redirect Count |
| :--- | :--- | :---: | :---: |
| http://studygroupshub.com/ | https://studygroupshub.com/ | 200 OK | 1 |
| https://studygroupshub.com/ | https://studygroupshub.com/ | 200 OK | 0 |
| http://www.studygroupshub.com/ | https://studygroupshub.com/ | 200 OK | 2 |
| https://www.studygroupshub.com/ | https://studygroupshub.com/ | 200 OK | 1 |
| https://studygroupshub.com/sitemap-index.xml | https://studygroupshub.com/sitemap-index.xml | 200 OK | 0 |
| https://studygroupshub.com/robots.txt | https://studygroupshub.com/robots.txt | 200 OK | 0 |

---

## 10. Mobile Lighthouse Lab Audit Matrix

Audited via Lighthouse 13.4.0 with mobile emulation and simulated mobile throttling:

| Target Page | URL | Performance | Accessibility | Best Practices | SEO |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Homepage (Run 1)** | / | 100 | 96 | 92 | 100 |
| **Homepage (Run 2)** | / | 98 | 96 | 92 | 100 |
| **Homepage (Run 3)** | / | 96 | 96 | 92 | 100 |
| **Homepage (Median)** | / | **98** | **96** | **92** | **100** |
| **Directory** | /communities/ | 98 | 96 | 92 | 100 |
| **Exam Hub (IELTS)** | /exam/ielts/ | 99 | 96 | 92 | 100 |
| **Exam Hub (USMLE)** | /exam/usmle/ | 87 | 96 | 92 | 100 |
| **Category Hub (English)** | /category/english-proficiency/ | 97 | 96 | 92 | 100 |
| **Platform Hub (Telegram)** | /platform/telegram/ | 92 | 96 | 92 | 100 |
| **Detail Page** | /group/telegram-makon-ap-exams-study-channel/ | 99 | 96 | 92 | 100 |

---

## 11. Claims & Policy Scan

- **Scanned HTML Files:** 267 files in dist/
- **Violations Detected:** 0
- **Policy Adherence:** No unsupported superlatives ("100% verified", "guaranteed safe", "all communities checked by humans"). Listings accurately reflect verified link status and transparent academic-integrity screening.

---

## 12. Verification & Test Suite Summary

- 
pm run typecheck ? 0 TypeScript errors
- 
pm run lint ? 0 ESLint errors
- 
pm run test ? 19 passed test suites (238 passed unit tests)
- 
pm run validate-data ? 154 published records validated, 0 errors
- 
pm run build ? 267 static HTML pages built in 7.37s
- 
pm run seo:audit ? 100% compliant with production SEO standards
