# Worship Analytics Dashboard — Song Usage & Rotation KPI System

A data analytics project that converts weekly worship setlists into structured operational insights.  
Built end-to-end with **Python, pandas, and matplotlib**, this project helps worship teams understand:

- Which songs are overused  
- Which songs are underused  
- How often songs rotate  
- Patterns in worship planning behavior  

Perfect for demonstrating data engineering, KPI modeling, visualization, and storytelling on your portfolio.

---

## 🧠 Project Summary

Church worship teams often plan setlists independently with limited visibility into historical usage patterns. This can lead to:

- Repetition fatigue  
- Lack of variety  
- Misaligned song rotation  
- Inconsistent worship engagement  

This project solves those problems using analytics. Based on historical setlists, it models and summarizes song usage patterns to support data-informed planning.

---

## 📦 Data & Pipeline

### Source  
- `data/setlist.xlsx` — Worship setlist history

### Output

| Output File | Description |
|-------------|-------------|
| `outputs/fact_song_usage.csv` | Normalized song usage fact table |
| `outputs/dim_song.csv` | Song dimension metadata |
| `outputs/dim_date.csv` | Date dimension |
| `outputs/song_usage_kpis.csv` | Song-level KPI summary |
| `outputs/figures/top10_songs.png` | Top 10 song usage chart |
| `outputs/figures/rotation_distribution.png` | Rotation distribution histogram |

---

## 🛠️ How It Works

### 1. Extract & Clean  
- Load Excel setlist file  
- Normalize to one record per song occurrence  
- Create rotation metrics based on dates  

### 2. Transform & Enrich  
Feature engineering includes:  
- Days since last use  
- Days between uses  
- Average rotation  
- Song usage segmentation  

### 3. Analyze & Visualize  
- Compute KPIs  
- Produce CSV outputs  
- Create publication-ready charts  

---

## 📈 Top 10 Songs by Usage

![Top 10 Songs](https://github.com/YSayaovong/Worship-Analytics-Dashboard/blob/main/outputs/figures/top10_songs.png)

---

## 📊 Distribution of Average Rotation

![Rotation Distribution](https://github.com/YSayaovong/Worship-Analytics-Dashboard/blob/main/outputs/figures/rotation_distribution.png)

---

## 📊 Key KPIs

| KPI | Description |
|-----|-------------|
| **Total Song Uses** | Total number of appearances |
| **Average Rotation (Days)** | Average interval between uses |
| **Days Since Last Used** | Recency indicator |
| **Overused (<21 days)** | Songs repeated too soon |
| **Underused (>90 days)** | Songs not used recently |

---

## 🧮 Example Insights

- Songs with **very short rotation** → possible repetition fatigue  
- Songs **not used in 3+ months** → candidates to reintroduce  
- Distribution of rotations → how balanced or unbalanced the worship cycle is  
- Top used songs → what the team relies on most  

These are strong talking points for interviews.

---

## 🧪 How To Run

### Install dependencies

```powershell
pip install -r requirements.txt
```

### Build normalized dataset

```powershell
cd "youdrive\Worship Analytics Dashboard"
py notebooks\build_song_usage_data.py
```

### Generate KPIs & Charts

```powershell
py notebooks\song_usage_kpi_report.py
```

### Outputs will appear in:

```
outputs/
├── song_usage_kpis.csv
└── figures/
    ├── top10_songs.png
    └── rotation_distribution.png
```

---

## 📁 Project Structure

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
│
└── README.md
```

---

## ✅ Skills Demonstrated

- Python (pandas, matplotlib)  
- Feature engineering  
- Date-based KPIs  
- Data modeling (fact/dim)  
- Visualization  
- Production-ready project structure  
- Portfolio-level storytelling  
