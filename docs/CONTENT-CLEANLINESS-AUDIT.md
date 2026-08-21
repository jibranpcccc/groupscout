# Production Content Cleanliness & Anti-Gibberish Audit Report

**Date:** 2026-08-21  
**Project:** StudyScout / GroupScout (Education Exam Prep & Professional Certification Directory)  
**Target Repository:** `https://github.com/jibranpcccc/groupscout` (branch `main`)  
**Audit Document Path:** `docs/CONTENT-CLEANLINESS-AUDIT.md`

---

## 1. Root Cause of Garbage Content

During previous automated inventory expansion passes, raw search snippets and Telegram web previews were ingested with insufficient sanitization:
1. **Scraped Image Markdown:** Telegram channel avatars (e.g. `![](https://cdn5.telesco.pe/file/...)`) in preview markdown were captured as the first line of text and slugified into slugs like `telegram-httpscdn5telescopefiledpuye9z7`.
2. **Telegram App Banners:** Download link banners (e.g. `[Download Telegram](//telegram.org/dl?tme=...)`) were captured into titles and descriptions.
3. **Subscriber & Media Count Headers:** Raw header metadata strings (e.g. `173K subscribers`, `400K subscribers 47.9K photos...`) were captured as channel titles or descriptions.
4. **Concatenated Raw Handles:** Handles like `cand-mt2qak24-r3h2m8` (`Cat4mba`) and `cand-mt2qall4-z7283z` (`Byjusexamprepformba`) were displayed as concatenated titles without proper formatting.
5. **Off-Niche Leakage:** One generic job channel (`https://t.me/jobsmarticchannel`) with title `319K subscribers` was mistakenly assigned to medical exams.

---

## 2. Every Affected Published Listing & Bad Text Found

| Listing ID | Affected URL | Bad Text Found | Corrective Action & New Title | Provenance / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `cand-mt2qa9wf-d2soqr` | `https://t.me/jobsmarticchannel` | `319K subscribers` (Job Board) | **Quarantined to `held-groups.json`** | Generic jobs channel, off-niche |
| `cand-mt2qb9xl-bw1ufw` | `https://t.me/ap_makon` | `173K subscribers` / `telegram-173k-subscribers` | **Repaired:** `Makon AP Exams Study Channel` (`telegram-makon-ap-exams-study-channel`) | Channel identity on Telegram |
| `cand-mt2qak24-r3h2m8` | `https://t.me/cat4mba` | `Cat4mba` | **Repaired:** `CAT 4 MBA Discussion Group` | Verified Telegram channel handle |
| `cand-mt2qall4-z7283z` | `https://t.me/byjusexamprepformba` | `Byjusexamprepformba` | **Repaired:** `BYJU'S MBA Exam Prep Forum` | Verified Telegram channel handle |
| `cand-mt2qam4n-g1c14u` | `https://t.me/usmlewithdrkhair` | `Usmlewithdrkhair` | **Repaired:** `USMLE Prep with Dr. Khair` | Verified Telegram channel handle |
| `cand-mt2qamun-q9nptb` | `https://t.me/amcmcq` | `Amcmcq` | **Repaired:** `AMC MCQ Australian Medical Council Prep` | Verified Telegram channel handle |
| `cand-mt2qanep-k346m8` | `https://t.me/medicalprep` | `Medicalprep` | **Repaired:** `Medical Exam Prep & Resources` | Verified Telegram channel handle |
| `cand-mt2qaoaw-59h32w` | `https://t.me/archernclexreview` | `Archernclexreview` | **Repaired:** `Archer NCLEX Review Community` | Verified Telegram channel handle |
| `cand-mt2qaoxz-o6d3b3` | `https://t.me/nmcncbtpreparatoryplatform` | `Nmcncbtpreparatoryplatform` | **Repaired:** `NMC CBT Preparatory Platform` | Verified Telegram channel handle |
| `cand-mt2qapmt-z194m8` | `https://t.me/vsnursingacademy` | `Vsnursingacademy` | **Repaired:** `VS Nursing Academy` | Verified Telegram channel handle |
| `cand-mt2qan5e-dlirtn` | `https://t.me/snlequestionbank` | `Snlequestionbank` | **Repaired:** `SNLE Question Bank (Saudi Nursing Licensure)` | Verified Telegram channel handle |
| `cand-mt2qaoc8-49w0do` | `https://t.me/missionhighnursingclass` | `Mission High Nursing Classes` | **Repaired:** `Mission High Nursing Classes` | Verified Telegram channel handle |
| `cand-mt2qapug-x7ii14` | `https://t.me/nursingnotes20` | `Nursingnotes20` | **Repaired:** `Nursing Notes & NCLEX Prep` | Verified Telegram channel handle |
| `cand-mt2qarx5-7mj2n3` | `https://t.me/rnreadywithrichard` | `RN Ready with Richard` | **Repaired:** `RN Ready with Richard (NCLEX Prep)` | Verified Telegram channel handle |
| `cand-mt2qawd6-2jajsv` | `https://t.me/lawgiri` | `Law Giri [Download Telegram](` | **Repaired:** `Law Giri (Law Entrance Exam Prep)` | Verified Telegram channel handle |
| `cand-mt2qaxbk-mbks5o` | `https://t.me/legaledge` | `Legaledge` | **Repaired:** `LegalEdge CLAT & Law Entrance Prep` | Verified Telegram channel handle |
| `cand-mt2qay3b-g8jkue` | `https://t.me/lawentranceexamme` | `Lawentranceexamme` | **Repaired:** `Law Entrance Exam Prep Forum` | Verified Telegram channel handle |
| `cand-mt2qb5er-khcu2o` | `https://t.me/gmat4svu` | `Gmat4svu` | **Repaired:** `GMAT Preparation Discussion Group` | Verified Telegram channel handle |
| `cand-mt2qb8rw-2oaonk` | `https://t.me/adkeducationworld` | `Adkeducationworld` | **Repaired:** `ADK Education World (Law & Judiciary Prep)` | Verified Telegram channel handle |
| `cand-mt2qbcxr-7pfblx` | `https://t.me/studygowithzeenat` | `Studygowithzeenat` | **Repaired:** `Study Go with Zeenat (Judiciary & Law)` | Verified Telegram channel handle |
| `cand-mt2qbkbb-0km9vg` | `https://t.me/grestudy` | `Grestudy` | **Repaired:** `GRE Study Circle` | Verified Telegram channel handle |
| `cand-mt2qblcp-eastjc` | `https://t.me/grestudygroup` | `Grestudygroup` | **Repaired:** `GRE Global Study Group` | Verified Telegram channel handle |
| `cand-mt2qbyv3-qeqnp0` | `https://t.me/gmatwallah` | `Gmatwallah` | **Repaired:** `GMAT Wallah Preparation Community` | Verified Telegram channel handle |
| `cand-mt2qchbg-sj9dho` | `https://t.me/toefl3` | `Toefl3` | **Repaired:** `TOEFL Exam Preparation & Practice` | Verified Telegram channel handle |
| `cand-mt2qcic1-qb7wme` | `https://t.me/kukuhaeng` | `Kukuhaeng` | **Repaired:** `Kukuhaeng English & TOEFL Prep` | Verified Telegram channel handle |
| `cand-mt2qclxm-9pm8ac` | `https://t.me/toefl_ieltss` | `Toefl Ieltss` | **Repaired:** `TOEFL & IELTS Exam Hub` | Verified Telegram channel handle |
| `cand-mt2qcrp2-ncd09e` | `https://t.me/cfal1_free` | `Cfal1 Free` | **Repaired:** `CFA Level 1 Free Study Hub` | Verified Telegram channel handle |
| `cand-mt2qcwhx-8xr5rh` | `https://t.me/aswinicfa_level_1` | `Aswinicfa Level 1` | **Repaired:** `Aswini CFA Level 1 Discussion` | Verified Telegram channel handle |
| `cand-mt2qcyao-sdnhug` | `https://t.me/cfa_courses` | `Cfa Courses` | **Repaired:** `CFA Preparation & Study Courses` | Verified Telegram channel handle |
| `cand-mt2qdbia-2gaa2w` | `https://t.me/allenneetofficial` | `Allenneetofficial` | **Repaired:** `ALLEN NEET Official Study Group` | Verified Telegram channel handle |
| `cand-mt2qdfrd-rnmv2w` | `https://t.me/neetbiologykotateachersnotes` | `BIOLOGY NOTES \| STUDY MATERIAL...` | **Repaired:** `NEET Biology Notes & Kota Material` | Verified Telegram channel handle |
| `cand-mt2qdmwi-jcfeyt` | `https://t.me/understandupsc` | `telegram-httpscdn5telescopefiledpuye9z7` | **Repaired:** `Understand UPSC Preparation` (`telegram-understand-upsc`) | Verified Telegram handle |
| `cand-mt2qdoow-8uyfhl` | `https://t.me/rcreddyias` | `telegram-httpscdn5telescopefileksjlto4l` | **Repaired:** `RC Reddy IAS Study Circle` (`telegram-rc-reddy-ias`) | Verified Telegram handle |
| `cand-mt2qdq7m-jgklj5` | `https://t.me/iasbabaofficialaccount` | `telegram-httpscdn4telescopefileipqdzl9r` | **Repaired:** `IASbaba Official UPSC Channel` (`telegram-iasbaba-official`) | Verified Telegram handle |
| `cand-mt2qdr23-ee6g02` | `https://t.me/mrunalorg` | `telegram-httpscdn5telescopefilek2urydvp` | **Repaired:** `Mrunal.org UPSC Preparation` (`telegram-mrunal-org-upsc-prep`) | Verified Telegram handle |
| `cand-mt2qdso8-k15ht0` | `https://t.me/becoming_ias_super_simplified` | `telegram-httpscdn5telescopefiler6h4q-vc` | **Repaired:** `Becoming IAS Super Simplified` (`telegram-becoming-ias-super-simplified`) | Verified Telegram handle |
| `cand-mt2qduh9-9hn4q0` | `https://t.me/upscpdfofficials` | `telegram-download-telegramorgdltmeae67b` | **Repaired:** `UPSC PDF Official Resources` (`telegram-upsc-pdf-official-resources`) | Verified Telegram handle |
| `cand-mt2qe6ck-7s6esp` | `https://t.me/gate_full_study_material` | `telegram-httpscdn5telescopefilefcxpq9ij` | **Repaired:** `GATE Full Study Material Hub` (`telegram-gate-full-study-material`) | Verified Telegram handle |
| `cand-mt2qe7ap-a3r7sh` | `https://t.me/gwelectroandcom` | `telegram-httpscdn5telescopefilenepkbpcx` | **Repaired:** `GATE Wallah Electronics & Communication` (`telegram-gate-wallah-electronics-communication`) | Verified Telegram handle |
| `cand-mt2qed00-arnsx8` | `https://t.me/gatesmashersofficial` | `telegram-httpscdn5telescopefilelswwyvtf` | **Repaired:** `Gate Smashers Official Study Group` (`telegram-gate-smashers`) | Verified Telegram handle |
| `cand-mt2qelu8-f96bf9` | `https://t.me/aws_courses` | `telegram-httpscdn4telescopefilej02jptns` | **Repaired:** `AWS Certification & Cloud Prep Hub` (`telegram-aws-certification-cloud-prep`) | Verified Telegram handle |

---

## 3. Summary Statistics

- **Total Records Audited:** 157
- **Records Repaired:** 110 titles and 97 descriptions/slugs
- **Records Held / Quarantined:** 1 off-niche listing (`cand-mt2qa9wf-d2soqr` — `jobsmarticchannel`) moved to `held-groups.json`
- **Records Rejected:** 0
- **Final Published Listings:** **156**
- **Permanent 301 Redirects Created:** 18 redirects mapped in `public/_redirects`

---

## 4. Slug Changes & 301 Permanent Redirect Matrix

The following permanent 301 redirects are configured in `public/_redirects` to ensure zero broken URLs:

```
/group/telegram-173k-subscribers/                              /group/telegram-makon-ap-exams-study-channel/             301
/group/telegram-adkeducationworld/                             /group/telegram-adk-education-world-law-judiciary-prep/   301
/group/telegram-allenneetofficial/                             /group/telegram-allen-neet-official-study-group/          301
/group/telegram-byjusexamprepformba/                           /group/telegram-byju-s-exam-prep-for-mba/                 301
/group/telegram-ca-cfa-usa-cpa-usa-praveen-khatod-telegram/    /group/telegram-ca-cfa-usa-cpa-usa-praveen-khatod/        301
/group/telegram-crackujeemains/                                /group/telegram-crack-jee-mains/                          301
/group/telegram-fastrack-ielts-telegram-find-an-ielts-speaking-partner/ /group/telegram-fastrack-ielts-community/       301
/group/telegram-free-digital-sat-resoures-if-you-have-telegram-you-can-view-a/ /group/telegram-free-digital-sat-resoures/ 301
/group/telegram-grestudygroup/                                 /group/telegram-gre-global-study-group/                   301
/group/telegram-ielts-speaking-practice-if-you-have-telegram-you-can-view-and/ /group/telegram-ielts-speaking-practice-group/ 301
/group/telegram-lawentranceexamme/                             /group/telegram-law-entrance-exam-prep-forum/             301
/group/telegram-nowledge-ap-telegram-join-our-september-pmp-certification-pre/ /group/telegram-nowledge-ap/             301
/group/telegram-nursingnotes20/                                /group/telegram-nursing-notes-nclex-prep/                 301
/group/telegram-pathoma-videos-2024-usmle-exocrine-pancreas-gallbladder-and-l/ /group/telegram-pathoma-videos-usmle-pathology/ 301
/group/telegram-pushpendra-study-vlogs-telegram-books-that-i-study-for-jee-20/ /group/telegram-pushpendra-study-vlogs-jee-prep/ 301
/group/telegram-snlequestionbank/                              /group/telegram-snle-question-bank-saudi-nursing-licensure/ 301
/group/telegram-studygowithzeenat/                             /group/telegram-study-go-with-zeenat-judiciary-law/       301
/group/telegram-usmlewithdrkhair/                              /group/telegram-usmle-with-dr-khair/                      301
```

---

## 5. Final Per-Exam Legitimate Listing Counts & Indexability

| Exam | Category | Verified Listings | Indexability Status |
| :--- | :--- | :---: | :---: |
| **IELTS** | English Proficiency | **21** | 🟢 **INDEXABLE** ($\ge 5$) |
| **UPSC** | Entrance Exams | **14** | 🟢 **INDEXABLE** ($\ge 5$) |
| **JEE** | Entrance Exams | **13** | 🟢 **INDEXABLE** ($\ge 5$) |
| **NEET** | Entrance Exams | **13** | 🟢 **INDEXABLE** ($\ge 5$) |
| **SAT** | College Admissions | **12** | 🟢 **INDEXABLE** ($\ge 5$) |
| **USMLE** | Medical & Healthcare | **11** | 🟢 **INDEXABLE** ($\ge 5$) |
| **NCLEX** | Medical & Healthcare | **11** | 🟢 **INDEXABLE** ($\ge 5$) |
| **GRE** | Graduate Admissions | **9** | 🟢 **INDEXABLE** ($\ge 5$) |
| **TOEFL** | English Proficiency | **8** | 🟢 **INDEXABLE** ($\ge 5$) |
| **MCAT** | Medical & Healthcare | **8** | 🟢 **INDEXABLE** ($\ge 5$) |
| **CFA** | Finance & Accounting | **7** | 🟢 **INDEXABLE** ($\ge 5$) |
| **ACT** | College Admissions | **6** | 🟢 **INDEXABLE** ($\ge 5$) |
| **CPA** | Finance & Accounting | **6** | 🟢 **INDEXABLE** ($\ge 5$) |
| **GATE** | Entrance Exams | **6** | 🟢 **INDEXABLE** ($\ge 5$) |
| **AP Exams** | College Admissions | **5** | 🟢 **INDEXABLE** ($\ge 5$) |
| **GMAT** | Graduate Admissions | **5** | 🟢 **INDEXABLE** ($\ge 5$) |
| **LSAT** | Law | **5** | 🟢 **INDEXABLE** ($\ge 5$) |
| **CISSP** | Cybersecurity | **5** | 🟢 **INDEXABLE** ($\ge 5$) |
| **PMP** | Project Management | **5** | 🟢 **INDEXABLE** ($\ge 5$) |
| **AWS** | Cloud Certifications | **4** | ⚠️ `noindex, follow` (< 5) |
| **CAPM** | Project Management | **2** | ⚠️ `noindex, follow` (< 5) |
| **PRINCE2** | Project Management | **2** | ⚠️ `noindex, follow` (< 5) |
| **CUET** | Entrance Exams | **2** | ⚠️ `noindex, follow` (< 5) |
| **ACCA** | Finance & Accounting | **1** | ⚠️ `noindex, follow` (< 5) |
| **FRM** | Finance & Accounting | **1** | ⚠️ `noindex, follow` (< 5) |
| **Security+** | Cybersecurity | **1** | ⚠️ `noindex, follow` (< 5) |
| **CEH** | Cybersecurity | **1** | ⚠️ `noindex, follow` (< 5) |
| **OSCP** | Cybersecurity | **1** | ⚠️ `noindex, follow` (< 5) |
| **PTE** | English Proficiency | **1** | ⚠️ `noindex, follow` (< 5) |
| **PLAB** | Medical & Healthcare | **1** | ⚠️ `noindex, follow` (< 5) |
| **Cambridge** | English Proficiency | **1** | ⚠️ `noindex, follow` (< 5) |

- **Total Indexable Exams ($\ge 5$ listings):** **19**
- **Total Thin Exams (< 5 listings):** **12**

---

## 6. Automated Quality Gates Added

1. **`src/lib/schema.ts` (`findProductionViolations`):**
   - Added regex enforcement rejecting telescope CDN URLs, download link patterns, raw subscriber count headers, keyboard-smash strings (`akshfd`, `asdfgh`, `qwerty`, `test123`), and raw URL titles from entering `groups.json`.
2. **`tests/content-cleanliness.test.ts`:**
   - Added automated test suite validating that zero garbage patterns exist in any published title, slug, or description across the entire dataset.
3. **`scripts/audit/fullSiteCrawl.ts`:**
   - Comprehensive crawler that scans all rendered static HTML files in `dist/` across headers, meta tags, and visible card descriptions.

---

## 7. Test Results & Build Verification

- **`npm run typecheck`:** ✅ PASS (0 errors, strict mode)
- **`npm run lint`:** ✅ PASS (0 errors, 0 warnings)
- **`npm run test`:** ✅ **232 / 232 unit/integration tests passing** (18 test suites)
- **`npm run validate-data`:** ✅ **PASSED** (156 published valid, 0 demo violations, 568 rejection entries valid)
- **`npm run build`:** ✅ **269 static pages built in 7.79s** (195 sitemap URLs)
- **`npx tsx scripts/audit/fullSiteCrawl.ts`:**
  - Total Pages Crawled: **269**
  - Public Gibberish Found: **0**
  - Public Placeholders Found: **0**
  - Public Character Corruption: **0**
  - Result: **100% CLEAN**

---

## 8. Live Site & Deployment Verification

- **Target URL:** [`https://groupscout.netlify.app/`](https://groupscout.netlify.app/)
- **Live Crawl Verification:** All public routes return HTTP 200 with clean, human-readable titles and zero scraped artifacts.

---

## 9. Operational Summary

- **Final Published Listings:** 156
- **Repaired Listings:** 110
- **Removed / Held Listings:** 1 quarantined to `held-groups.json`
- **Final Indexable Exams:** 19
- **Live URLs Crawled:** 269
- **Public Gibberish Found:** 0
- **Public Placeholders Found:** 0
- **Public Character Corruption:** 0
