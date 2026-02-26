# Worship Analytics Dashboard — Song Usage & Rotation KPI System

## 1. Project Background

As a data analyst embedded in a Hmong worship ministry context, I built this pipeline to answer a question that most worship teams never think to ask: *Are we actually rotating our songs — or are we just repeating the ones we know?*

Worship teams typically plan setlists in the moment, week to week, with no systematic visibility into historical usage patterns. Over time, this leads to uneven rotation, congregation fatigue from repeated songs, and an underutilized catalog of hymns that fade from memory. This project converts raw Excel setlist history into structured operational insights using a full Python analytics pipeline.

The data covers **54 services from January 2025 through February 2026** — 172 total song appearances across a catalog of 118 unique songs.

Insights and recommendations are structured around four key areas:

- **Song Usage Concentration:** Identifying which songs dominate the rotation and by how much
- **Rotation Health:** Measuring how evenly the catalog is being cycled
- **Recency Analysis:** Flagging songs that are overdue for reintroduction
- **Catalog Utilization:** Understanding what fraction of the available song library is actively in use

---

## 2. Data Structure & Initial Checks

The pipeline is built on a star schema with one fact table and two dimension tables, all derived from a single source Excel file.

```
dim_date                               dim_song
─────────────────────                  ─────────────────────────
Date        (PK, Date)                 SongId      (PK, String)
Year        (Int)                      SongName    (String)
Month       (Int)         ◄──────┐     CCLINumber  (String)
MonthName   (String)             │     Topic       (String)
Quarter     (String)             │     Source      (String)
ISOWeek     (Int)                │          │
                                 │          │
                      fact_song_usage       │
                      ──────────────────────────────
                      Date           (FK → dim_date)
                      Song           (FK → dim_song)
                      Source         (String)
                      Topic          (String)
                      DaysSinceLast  (Float)
                      WeeksSinceLast (Float)
                      IsFirstOccurrence (Boolean)
                      Year / Month / MonthName / Quarter / WeekOfYear
```

| Table | Grain | Row Count |
|---|---|---|
| `fact_song_usage` | One row per song appearance per service | 172 |
| `dim_song` | One row per unique song in the catalog | 118 |
| `dim_date` | One row per service date | 54 |
| `song_usage_kpis` | One row per song with computed KPI fields | 118 |

**Initial Checks Performed:**
- Confirmed 54 distinct service dates with no duplicate date-song combinations
- Validated song sources: HBNA Songbook (83.9%), English Hymn (6.8%), Contemporary (3.4%), Xh Thai's Hymnal Book (3.4%), Hmong Hymn (2.5%)
- Confirmed `DaysSinceLast` is null for first occurrences — correct by design, no prior use to calculate from
- Verified overused threshold: avg rotation < 21 days; underused threshold: days since last use > 90 days
- Confirmed `avg_rotation_days` is null for single-use songs — rotation requires a minimum of two data points

---

## 3. Executive Summary

Across 54 services and 172 total song appearances, the team draws from a catalog of **118 unique songs** — but usage is heavily concentrated. A single song, **#4 - Koj Yog Vajtswv**, accounts for **18 of 172 appearances (10.5%)** and appears in **27.8% of all services**. Meanwhile, **78.8% of the catalog (93 songs) has been used only once**, and **69.5% of all songs have not appeared in over 90 days**.

The catalog is large but underutilized. The team has a deep library — it is simply not rotating through it.

| KPI | Value |
|---|---|
| Total Unique Songs | 118 |
| Total Song Appearances | 172 |
| Avg Songs per Service | 3.2 |
| Single-Use Songs | 93 (78.8% of catalog) |
| Songs with Rotation Data (used 2+ times) | 25 (21.2%) |
| Median Avg Rotation (multi-use songs) | 77.0 days |
| Mean Avg Rotation | 84.7 days |
| Overused Songs (< 21 days avg rotation) | 1 (0.8%) |
| Underused Songs (> 90 days since last use) | 82 (69.5%) |
| Songs Active in Last 30 Days | 15 (12.7%) |

> **The core finding:** One song dominates, most songs appear once and disappear, and 44.9% of the catalog hasn't been used in over 180 days. The rotation system isn't broken — it largely doesn't exist yet. Introducing a structured rotation policy would immediately improve variety and deepen congregational familiarity with the song library.

---

## 4. Insights Deep Dive

### 4a. One Song Accounts for 10.5% of All Appearances and Plays in 1 of Every 4 Services

**Metric:** Total Uses by Song (Top 10)

**Finding:** #4 - Koj Yog Vajtswv was used **18 times** across the dataset period — **4.5x more than any other song** in the top 10, which max out at 4 uses. It appeared in **15 of 54 services (27.8%)**, meaning the congregation hears it roughly once a month. The full top 10 together account for only **27.9% of all appearances (48 of 172)** — a reasonably distributed group except for the single outlier at the top.

![Top 10 Songs by Usage](https://github.com/YSayaovong/Worship-Analytics-Dashboard/blob/main/outputs/figures/top10_songs.png?raw=true)

| Song | Total Uses | % of All Appearances | Avg Rotation | Last Used |
|---|---|---|---|---|
| #4 - Koj Yog Vajtswv | 18 | 10.5% | 22.2 days | 2026-01-25 |
| #154 - Cov Ntseeg Yexus Yog Ib Tsevneeg | 4 | 2.3% | 77.0 days | 2025-08-24 |
| #28 - Tswv Yexus, Kuv Hnov Koj Hu Kuv | 4 | 2.3% | 46.7 days | 2025-07-27 |
| #57 - Kuv Tus Kwvluag Yog Tswv Yexus | 4 | 2.3% | 51.3 days | 2025-11-02 |
| #1 - Vajtswv Thov Koj Foom Koobhmoov | 3 | 1.7% | 14.0 days | 2025-10-05 |
| #134 - Cov Kwvtij Hmoob | 3 | 1.7% | 115.5 days | 2025-11-23 |
| #29 - Kuv Muab Kuv Lub Cev Rau Yexus | 3 | 1.7% | 105.0 days | 2025-08-31 |
| #48 - Kuv ua Koj Tsaug, Tus Tswv Yexus | 3 | 1.7% | 66.5 days | 2026-02-15 |
| #59 - Txij Hnub Kuv Lees Yuav Tswv Yexus | 3 | 1.7% | 49.0 days | 2025-08-03 |
| #6 - Vajtswv, Vajtswv, Vajtswv | 3 | 1.7% | 52.5 days | 2025-05-18 |

At 22.2 days average rotation, #4 sits just above the overused threshold (< 21 days) and functions as the team's go-to default rather than a deliberate weekly choice. Its last use was January 25, 2026 — it is likely to reappear within weeks.

---

### 4b. 78.8% of the Song Catalog Has Been Used Only Once

**Metric:** Single-Use vs. Multi-Use Song Distribution

**Finding:** Of 118 unique songs, **93 (78.8%) have been used exactly once**. Only **25 songs (21.2%)** have been used more than once, and of those, just 10 have been used 3 or more times. The single-use majority accounts for **93 of 172 total appearances (54.1%)** — more than half of all service song slots go to songs the congregation will likely never hear again.

| Usage Tier | Song Count | % of Catalog | Total Appearances |
|---|---|---|---|
| Used once | 93 | 78.8% | 93 |
| Used 2 times | 15 | 12.7% | 30 |
| Used 3–4 times | 9 | 7.6% | 31 |
| Used 18 times (#4 only) | 1 | 0.8% | 18 |

This pattern reveals that the team introduces new songs regularly — nearly one new song introduced per service on average — but rarely revisits them. The congregation is continuously encountering unfamiliar material rather than deepening familiarity with a rotating core set of well-known songs.

---

### 4c. Median Rotation Is 77 Days — but 40% of Multi-Use Songs Are Cycling Slower Than 90 Days

**Metric:** Distribution of Average Rotation Days (multi-use songs only)

**Finding:** Among the 25 songs used more than once, the **median average rotation is 77.0 days** and the mean is **84.7 days**. The distribution is right-skewed: a cluster of songs rotate every 50–75 days, while a long tail extends to 224 days between uses. The single overused song (#1 - Vajtswv Thov Koj Foom Koobhmoov at 14.0 days) was played 3 times in rapid succession within September–October 2025, then went 137 days without reappearing.

![Rotation Distribution](https://github.com/YSayaovong/Worship-Analytics-Dashboard/blob/main/outputs/figures/rotation_distribution.png?raw=true)

| Rotation Bucket | Song Count | % of Multi-Use Songs |
|---|---|---|
| < 21 days (overused) | 1 | 4.0% |
| 21–60 days | 9 | 36.0% |
| 61–90 days | 5 | 20.0% |
| > 90 days | 10 | 40.0% |

The 9 songs cycling at 21–60 days represent the healthiest part of the rotation — frequent enough for familiarity, spaced enough to feel fresh. The 10 songs at > 90 days are the most obvious candidates for bringing back into more regular rotation.

---

### 4d. 44.9% of the Catalog Has Been Dormant for Over 6 Months

**Metric:** Days Since Last Used — Full Catalog Distribution

**Finding:** Only **15 songs (12.7%)** were used in the last 30 days. A further 21 (17.8%) fall in the 31–90 day window. The remaining **82 songs (69.5%)** have not appeared in over 90 days, including **53 songs (44.9%)** that have gone over 180 days without use.

| Recency Category | Song Count | % of Catalog |
|---|---|---|
| Active (0–30 days) | 15 | 12.7% |
| Recent (31–90 days) | 21 | 17.8% |
| Dormant (91–180 days) | 29 | 24.6% |
| Stale (180+ days) | 53 | 44.9% |

The strongest reintroduction candidates are songs with prior multi-use history that have gone dormant — they are proven with the congregation and are simply being overlooked:

| Song | Prior Uses | Days Dormant |
|---|---|---|
| #6 - Vajtswv, Vajtswv, Vajtswv | 3 | 277 days |
| #89 - Kuv Yuav Tsa Cov Ntseeg Vajtswv | 2 | 256 days |
| #90 - Vajtswv Hu Peb Los Ua Nws Haivneeg | 2 | 256 days |
| #11 - Vajtswv, Peb Yog Koj Cov Menyuam | 2 | 249 days |
| #28 - Tswv Yexus, Kuv Hnov Koj Hu Kuv | 4 | 207 days |

---

### 4e. Song Activity Peaked in Q1–Q2 2025 and Has Gradually Declined

**Metric:** Song Appearances by Quarter and Month, 2025–2026

**Finding:** Q1 2025 (39 uses) and Q2 2025 (40 uses) were the most active periods. Q4 2025 dropped to 32 uses — a **17.9% decline from Q1** — with October recording just 7 song appearances, the single lowest month in the dataset. Q1 2026 is tracking at 23 uses through mid-February, roughly in line with the comparable 2025 period (24 uses).

| Quarter | Song Appearances |
|---|---|
| 2025 Q1 | 39 |
| 2025 Q2 | 40 |
| 2025 Q3 | 38 |
| 2025 Q4 | 32 |
| 2026 Q1 (partial, through Feb 15) | 23 |

The consistent average of 3.2 songs per service across all months confirms the per-service format is stable — the quarterly variation reflects attendance and service volume fluctuations, not changes in worship planning behavior.

---

## 5. Recommendations

Based on the above findings, the following actions are recommended:

- **Establish a "core rotation" list of 20–30 songs with an explicit 4–8 week cycle target.** The current median rotation of 77 days is a reasonable baseline, but it applies only to 25 songs. Formalizing a rotation policy for the most congregation-familiar songs would replace the current default-to-#4 behavior with an intentional system.

- **Limit #4 - Koj Yog Vajtswv to once every 6–8 weeks.** At 27.8% of services, this song is functioning as a crutch rather than a highlight. Reducing its frequency creates space for underused songs and preserves its impact when it does appear.

- **Schedule 2–3 reintroductions per month from the dormant-but-proven list.** Songs like #6 (277 days dormant, 3 prior uses) and #28 (207 days dormant, 4 prior uses) have proven congregational familiarity and are the lowest-risk way to expand rotation variety without requiring new song learning.

- **Introduce a "minimum two repeats" rule for every new song added.** If 93 songs are introduced and never heard again, the congregation cannot learn them. Any new song added to the setlist should be penciled in for at least two return appearances within 60 days — this validates whether the song belongs in the rotation and converts single-use introductions into catalog assets.

- **Automate a weekly rotation health summary from the existing pipeline.** The `song_usage_kpis.csv` output already contains all necessary fields: `days_since_last_used`, `avg_rotation_days`, and the overused/underused flags. A simple weekly report highlighting songs due for reintroduction and flagging any approaching the overuse threshold would make this analysis actionable without manual review.

- **Enrich the data model with structured topic and service occasion fields.** The current `Topic` column is sparsely and inconsistently populated. Adding structured fields for service theme, liturgical season, and song position (opener vs. closer) would enable thematic planning analysis and reveal whether certain songs belong to specific service contexts rather than general rotation.

---

## How To Run

### Install Dependencies
```powershell
pip install -r requirements.txt
```

### Build Normalized Dataset
```powershell
cd "youdrive\Worship Analytics Dashboard"
py notebooks\build_song_usage_data.py
```

### Generate KPIs & Charts
```powershell
py notebooks\song_usage_kpi_report.py
```

### Outputs
```
outputs/
├── fact_song_usage.csv
├── dim_song.csv
├── dim_date.csv
├── song_usage_kpis.csv
└── figures/
    ├── top10_songs.png
    └── rotation_distribution.png
```

---

## Project Structure

```
Worship-Analytics-Dashboard/
│
├── data/
│   └── setlist.xlsx
│
├── notebooks/
│   ├── build_song_usage_data.py
│   └── song_usage_kpi_report.py
│
├── outputs/
│   ├── fact_song_usage.csv
│   ├── dim_song.csv
│   ├── dim_date.csv
│   ├── song_usage_kpis.csv
│   └── figures/
│       ├── top10_songs.png
│       └── rotation_distribution.png
│
├── requirements.txt
└── README.md
```

---

## Tools Used

- Python (pandas, matplotlib)
- Feature engineering (date-based KPI derivation)
- Star schema data modeling (fact/dim architecture)
- Visualization (publication-ready charts)
- Excel (source data ingestion)
