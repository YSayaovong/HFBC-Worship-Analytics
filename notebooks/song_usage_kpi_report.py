import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

# ---------- Paths ----------
ROOT = Path(__file__).resolve().parents[1]
output_dir = ROOT / "outputs"
fig_dir = output_dir / "figures"
fig_dir.mkdir(exist_ok=True)

# ---------- Load prepared data ----------
fact = pd.read_csv(output_dir / "fact_song_usage.csv", parse_dates=["Date"])
dim_song = pd.read_csv(output_dir / "dim_song.csv")
dim_date = pd.read_csv(output_dir / "dim_date.csv", parse_dates=["Date"])

# Merge song metadata onto fact for easier reporting
df = fact.merge(dim_song, left_on="Song", right_on="SongName", how="left")

# ---------- Song-level KPIs ----------
song_stats = (
    df.groupby("SongName")
      .agg(
          total_uses=("Date", "count"),
          avg_rotation_days=("DaysSinceLast", "mean"),
          last_use=("Date", "max"),
      )
      .reset_index()
)

# Days since last used
today = pd.Timestamp.today().normalize()
song_stats["days_since_last_used"] = (today - song_stats["last_use"]).dt.days

# Classification flags
song_stats["overused_flag"] = song_stats["avg_rotation_days"] < 21          # tweak threshold if needed
song_stats["underused_flag"] = song_stats["days_since_last_used"] > 90      # tweak threshold if needed

# ---------- Portfolio-level summary ----------
total_distinct_songs = song_stats.shape[0]
total_uses = df.shape[0]
overall_avg_rotation = song_stats["avg_rotation_days"].mean()

print("=== Portfolio Summary ===")
print(f"Total distinct songs: {total_distinct_songs}")
print(f"Total song uses:      {total_uses}")
print(f"Avg rotation (days):  {overall_avg_rotation:.1f}")
print()

# ---------- Top 10 songs by usage ----------
top10 = (
    song_stats.sort_values("total_uses", ascending=False)
              .head(10)
)

print("=== Top 10 Songs by Total Uses ===")
print(top10[["SongName", "total_uses", "avg_rotation_days", "days_since_last_used"]])
print()

# ---------- Overused songs ----------
overused = (
    song_stats[song_stats["overused_flag"]]
    .sort_values("avg_rotation_days")
)

print("=== Overused Songs (avg rotation < 21 days) ===")
print(overused[["SongName", "total_uses", "avg_rotation_days"]].head(10))
print()

# ---------- Underused songs ----------
underused = (
    song_stats[song_stats["underused_flag"]]
    .sort_values("days_since_last_used", ascending=False)
)

print("=== Underused Songs (not used in 90+ days) ===")
print(underused[["SongName", "total_uses", "days_since_last_used"]].head(10))
print()

# ---------- Save detailed KPI table ----------
kpi_path = output_dir / "song_usage_kpis.csv"
song_stats.to_csv(kpi_path, index=False)
print(f"Saved song-level KPIs to: {kpi_path}")

# ---------- Chart 1: Top 10 songs by usage ----------
plt.figure(figsize=(10, 6))
plt.barh(top10["SongName"], top10["total_uses"], edgecolor="black", alpha=0.8)
plt.gca().invert_yaxis()
plt.xlabel("Total Uses", fontsize=12)
plt.ylabel("Song", fontsize=12)
plt.title("Top 10 Songs by Usage", fontsize=14, fontweight="bold")
plt.grid(axis="x", linestyle="--", alpha=0.4)
plt.tight_layout()
top10_path = fig_dir / "top10_songs.png"
plt.savefig(top10_path)
plt.close()

print(f"Saved chart: {top10_path}")

# ---------- Chart 2: Distribution of Average Rotation ----------
plt.figure(figsize=(10, 6))

rotation_values = song_stats["avg_rotation_days"].dropna()

plt.hist(
    rotation_values,
    bins=12,                 # adjust if you want more/less detail
    edgecolor="black",
    alpha=0.75
)

plt.xlabel("Average Rotation (Days)", fontsize=12)
plt.ylabel("Number of Songs", fontsize=12)
plt.title("Distribution of Average Song Rotation", fontsize=14, fontweight="bold")
plt.grid(axis="y", linestyle="--", alpha=0.5)

# Median marker (nice talking point)
median_val = rotation_values.median()
plt.axvline(median_val, color="red", linestyle="--", linewidth=2)
plt.text(
    median_val + 1,
    plt.ylim()[1] * 0.9,
    f"Median: {median_val:.1f} days",
    color="red",
    fontsize=10
)

plt.tight_layout()
rotation_path = fig_dir / "rotation_distribution.png"
plt.savefig(rotation_path)
plt.close()

print(f"Saved chart: {rotation_path}")
