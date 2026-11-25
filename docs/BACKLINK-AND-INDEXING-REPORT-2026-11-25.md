# StudyGroupsHub — Catalog Expansion, Indexing & Backlink Report

**Date:** 2026-11-25  
**Production Domain:** https://studygroupshub.com/  
**Primary Repository:** https://github.com/jibranpcccc/groupscout (`fed07ad`)

---

## 1. Inventory & Indexable Hub Expansion

Added **6 live-verified Discord study communities** (verified against official Discord Invite API v10 with real member counts; 3 promoted from `held-groups.json` and 3 newly sourced):

| Listing | Slug | Exams | Members | Verification |
| :--- | :--- | :--- | :---: | :--- |
| **PrepGo - AP Exam Prep Community** | `discord-prepgo-ap-exam-prep` | `ap-exams` | `68` | `source-confirmed` (`prepgo.com`) |
| **PMP Exam Study Group** | `discord-pmp-exam-study-group` | `pmp` | `45` | `unverified` (`r/pmp`) |
| **Cybersecurity Station** | `discord-certstation` | `cissp`, `security-plus`, `aws`, `pmp` | `45,120` | `unverified` (`r/pmp`, Discord) |
| **Professor Messer** | `discord-professor-messer` | `security-plus`, `comptia-a-plus`, `network-plus` | `83,675` | `source-confirmed` (`professormesser.com/discord/`) |
| **CPA Study Group** | `discord-cpa-study-group` | `cpa` | `224` | `unverified` (promoted from held) |
| **Virtual Neet LIVE** | `discord-virtual-neet-live` | `neet` | `1,861` | `unverified` (promoted from held) |

### Unlocked Indexable Hubs & Metrics
- **Published Listings:** `154` → **`160`**
- **Generated Static Pages:** `267` → **`278`**
- **Indexable Sitemap URLs:** `73` → **`76`** (1:1 parity, `0` errors in `npm run seo:audit`)
- **Unlocked Exam Hub:** `/exam/pmp/` (`16` total indexable exam hubs)
- **Unlocked Category Hub:** `/category/project-management/` (`9` total indexable category hubs)
- **Remaining Near-Threshold Exam Hubs:** `act` (`4`), `mcat` (`4`), `ap-exams` (`4`), `aws` (`4`) — each 1 listing away from indexability (`>= 5`)

---

## 2. Multi-Protocol Indexing Broadcast (Live `76` URLs)

| Protocol | Endpoint | Result |
| :--- | :--- | :--- |
| **Microsoft Bing IndexNow** | `https://www.bing.com/indexnow` | **HTTP 200** (`76` URLs) |
| **Central IndexNow API** | `https://api.indexnow.org/indexnow` | **HTTP 200** (`76` URLs) |
| **Google WebSub (PubSubHubbub)** | `https://pubsubhubbub.appspot.com/` (`rss.xml`) | **HTTP 204** |
| **Blo.gs XML-RPC** | `http://ping.blo.gs/` (site, RSS, GitHub toolkit, Gist) | **4/4 Succeeded** (`flerror: False`) |
| **Twingly XML-RPC** | `http://rpc.twingly.com/` (site, RSS, GitHub toolkit, Gist) | **4/4 Thanks for the ping** (`flerror: False`) |
| **Wayback Machine Save** | `https://web.archive.org/save/...` | Timeout / HTTP 523 (upstream archive.org transient error) |

---

## 3. Verified Live Backlink & Distribution Assets (`HTTP 200 OK`)

| Asset | URL | HTTP Status |
| :--- | :--- | :---: |
| **Live Homepage** | https://studygroupshub.com/ | `200` |
| **New PMP Exam Hub** | https://studygroupshub.com/exam/pmp/ | `200` |
| **New Project Management Hub** | https://studygroupshub.com/category/project-management/ | `200` |
| **New PrepGo AP Detail Page** | https://studygroupshub.com/group/discord-prepgo-ap-exam-prep/ | `200` |
| **IndexNow Verification Key** | https://studygroupshub.com/d870a41d9be84e6097d627b0a8877bc9.txt | `200` |
| **Primary GitHub Repo (Optimized)** | https://github.com/jibranpcccc/groupscout | `200` |
| **Primary Repo Release v1.0.0** | https://github.com/jibranpcccc/groupscout/releases/tag/v1.0.0 | `200` |
| **Companion CLI Repo** | https://github.com/jibranpcccc/exam-study-pacing-toolkit | `200` |
| **Companion Release v1.0.0** | https://github.com/jibranpcccc/exam-study-pacing-toolkit/releases/tag/v1.0.0 | `200` |
| **Public Gist — Directory Guide** | https://gist.github.com/jibranpcccc/c9648097dbffe64d230ff915652e8586 | `200` |
| **Public Gist — Pacing Calculator** | https://gist.github.com/jibranpcccc/e9a7968fd98c3e6b50b47deed5fd12b7 | `200` |
| **Colab — General Study Pacing** | https://colab.research.google.com/github/jibranpcccc/groupscout/blob/main/notebooks/study_groups_pacing_and_community_finder.ipynb | `200` |
| **Colab — Grad & Exam Planner** | https://colab.research.google.com/github/jibranpcccc/groupscout/blob/main/notebooks/exam_study_planner_and_benchmarks.ipynb | `200` |
| **Colab — CISSP Pacing** | https://colab.research.google.com/github/jibranpcccc/groupscout/blob/main/notebooks/cybersecurity_cert_pacing_calculator.ipynb | `200` |
| **Colab — LSAT Scoring Pacer** | https://colab.research.google.com/github/jibranpcccc/groupscout/blob/main/notebooks/law_school_lsat_scoring_and_prep_pacer.ipynb | `200` |
| **Colab — UPSC Syllabus Tracker** | https://colab.research.google.com/github/jibranpcccc/groupscout/blob/main/notebooks/upsc_ias_syllabus_tracker_and_discussion_matcher.ipynb | `200` |
