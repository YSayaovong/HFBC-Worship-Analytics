import pandas as pd
from pathlib import Path

# ---------- Paths ----------
ROOT = Path(__file__).resolve().parents[1]
data_path = ROOT / "data" / "setlist.xlsx"
output_dir = ROOT / "outputs"
output_dir.mkdir(exist_ok=True)

# ---------- Load raw data ----------
df = pd.read_excel(data_path, sheet_name=0)

# Rename for clarity if needed
if "Column1" in df.columns:
    df = df.rename(columns={"Column1": "Source"})

# Ensure Date is datetime
df["Date"] = pd.to_datetime(df["Date"])

# ---------- Sort & calculate rotation gap ----------
df = df.sort_values(["Song", "Date"])

df["PrevDate"] = df.groupby("Song")["Date"].shift(1)
df["DaysSinceLast"] = (df["Date"] - df["PrevDate"]).dt.days
df["WeeksSinceLast"] = df["DaysSinceLast"] / 7

# First occurrence flag
df["IsFirstOccurrence"] = df["PrevDate"].isna()

# ---------- Date features ----------
df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["MonthName"] = df["Date"].dt.strftime("%b")
df["Quarter"] = df["Date"].dt.to_period("Q").astype(str)
df["WeekOfYear"] = df["Date"].dt.isocalendar().week

# ---------- Build fact table ----------
fact_song_usage = df[[
    "Date",
    "Song",
    "CCLI Number",
    *(["Source"] if "Source" in df.columns else []),
    "Topic",
    "DaysSinceLast",
    "WeeksSinceLast",
    "IsFirstOccurrence",
    "Year",
    "Month",
    "MonthName",
    "Quarter",
    "WeekOfYear",
]]

fact_song_usage.to_csv(output_dir / "fact_song_usage.csv", index=False)

# ---------- Build dim_song ----------
dim_song = (
    df.sort_values("Date")
      .groupby("Song")
      .agg({
          "CCLI Number": "first",
          "Topic": "first",
          **({"Source": "first"} if "Source" in df.columns else {})
      })
      .reset_index()
      .rename(columns={
          "Song": "SongName",
          "CCLI Number": "CCLINumber"
      })
)

dim_song["SongId"] = dim_song.index + 1  # simple surrogate key

cols = ["SongId", "SongName", "CCLINumber", "Topic"]
if "Source" in dim_song.columns:
    cols.append("Source")

dim_song = dim_song[cols]

dim_song.to_csv(output_dir / "dim_song.csv", index=False)

# ---------- Build dim_date ----------
dim_date = (
    df[["Date", "Year", "Month", "MonthName", "Quarter", "WeekOfYear"]]
      .drop_duplicates()
      .sort_values("Date")
)

dim_date = dim_date.rename(columns={"WeekOfYear": "ISOWeek"})
dim_date.to_csv(output_dir / "dim_date.csv", index=False)

print("Done. Created:")
print(f"- {output_dir / 'fact_song_usage.csv'}")
print(f"- {output_dir / 'dim_song.csv'}")
print(f"- {output_dir / 'dim_date.csv'}")
