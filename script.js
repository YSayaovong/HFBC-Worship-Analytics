// ===== CONFIG =====
const SRC = {
  setlist: "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/setlist/setlist.xlsx"
};

// ===== Utilities =====
async function fetchXlsxRows(rawUrl){
  const res = await fetch(rawUrl + "?v=" + Date.now(), { cache: "no-store" });
  if(!res.ok) throw new Error(`Fetch failed (${res.status})`);
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // defval keeps empty cells as empty strings so mapping is stable
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function excelToDate(v){
  if(!v) return null;

  // XLSX sometimes returns JS Date objects for date-formatted cells
  if(v instanceof Date && !isNaN(v)) return v;

  // Excel serial number
  if(typeof v === "number"){
    const d = XLSX.SSF.parse_date_code(v);
    if(!d) return null;
    return new Date(d.y, d.m - 1, d.d);
  }

  // String date (supports ISO, mm/dd/yyyy, etc.)
  const d = new Date(String(v).trim());
  return isNaN(d) ? null : d;
}

function startOfDay(d){
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function weekStartSunday(d){
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // Sunday = 0
  return x;
}

function dateKeyLocal(d){
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n){
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function clampStr(v){ return (v ?? "").toString().trim(); }

// ===== Theme (Google Charts) =====
const THEME = {
  text: "#e5e7eb",
  muted: "#9aa3b2",
  grid: "#1f2937",
  // Okabe-Ito (colorblind-friendly) + one extra
  palette: ["#56B4E9", "#E69F00", "#009E73", "#CC79A7", "#F0E442", "#0072B2", "#D55E00", "#999999"]
};

function chartBaseOptions(){
  return {
    backgroundColor: "transparent",
    fontName: "system-ui, Segoe UI, Roboto, Arial, sans-serif",
    legend: { textStyle: { color: THEME.text } },
    titleTextStyle: { color: THEME.text },
    hAxis: { textStyle: { color: THEME.text }, gridlines: { color: THEME.grid }, baselineColor: THEME.grid },
    vAxis: { textStyle: { color: THEME.text }, gridlines: { color: THEME.grid }, baselineColor: THEME.grid },
    colors: THEME.palette,
    chartArea: { width: "70%", height: "78%" }
  };
}

// ===== Parsing =====
function parseSetlistRows(rows){
  return rows.map(r=>{
    // Be tolerant to header naming
    const date = excelToDate(r.Date || r.date || r.ServiceDate || r["Service Date"]);
    const song = clampStr(r.Song || r.song || r.Title || r.title);
    const topic = clampStr(r.Topic || r.topic || r.Theme || r.theme);
    const source = clampStr(r.Source || r.source || r.Songbook || r.songbook || r.Book || r.book);
    return { date, song, topic, source: source || "Unknown" };
  }).filter(x => x.date && x.song);
}

// ===== Setlist (Nearest upcoming + previous) =====
async function renderSetlist(parsed){
  const upHead = document.getElementById("setlist-up-head");
  const upBody = document.getElementById("setlist-up-body");
  const lsHead = document.getElementById("setlist-last-head");
  const lsBody = document.getElementById("setlist-last-body");

  const byDate = new Map();
  for(const r of parsed){
    const k = dateKeyLocal(r.date);
    if(!byDate.has(k)) byDate.set(k, []);
    byDate.get(k).push(r);
  }

  const dates = Array.from(byDate.keys())
    .map(k => new Date(k + "T00:00:00"))
    .sort((a,b) => a - b);

  const today = startOfDay(new Date());

  const next = dates.find(d => startOfDay(d) >= today);
  const prev = [...dates].reverse().find(d => startOfDay(d) < today);

  function renderBlock(dateObj, head, body){
    head.innerHTML = "<tr><th>Date</th><th>Song</th><th>Topic</th></tr>";
    body.innerHTML = "";

    if(!dateObj){
      body.innerHTML = "<tr><td colspan='3'>No data</td></tr>";
      return;
    }

    const list = byDate.get(dateKeyLocal(dateObj)) || [];
    for(const r of list){
      body.innerHTML += `
        <tr>
          <td>${startOfDay(r.date).toLocaleDateString()}</td>
          <td>${r.song}</td>
          <td>${r.topic || ""}</td>
        </tr>`;
    }
  }

  renderBlock(next, upHead, upBody);
  renderBlock(prev, lsHead, lsBody);
}

// ===== Charts =====
function loadGoogle(){
  return new Promise(res=>{
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(res);
  });
}

function drawBar(dataArray, elementId, title){
  const data = google.visualization.arrayToDataTable([
    ["Song", "Plays"],
    ...dataArray
  ]);

  const options = {
    ...chartBaseOptions(),
    title,
    legend: { position: "none" },
    bars: "horizontal",
    chartArea: { width: "72%", height: "80%" }
  };

  new google.visualization.BarChart(document.getElementById(elementId)).draw(data, options);
}

function drawLine(dataArray, elementId, title){
  const data = google.visualization.arrayToDataTable([
    ["Week", "Songs"],
    ...dataArray
  ]);

  const options = {
    ...chartBaseOptions(),
    title,
    legend: { position: "none" },
    pointSize: 4,
    curveType: "function"
  };

  new google.visualization.LineChart(document.getElementById(elementId)).draw(data, options);
}

function drawDonut(dataArray, elementId, title){
  const data = google.visualization.arrayToDataTable([
    ["Source", "Count"],
    ...dataArray
  ]);

  const options = {
    ...chartBaseOptions(),
    title,
    pieHole: 0.45,
    pieSliceTextStyle: { color: THEME.text },
    legend: { position: "right", textStyle: { color: THEME.text } },
    chartArea: { width: "78%", height: "80%" }
  };

  new google.visualization.PieChart(document.getElementById(elementId)).draw(data, options);
}

function countTopSongs(events){
  const counts = new Map();
  for(const e of events){
    counts.set(e.song, (counts.get(e.song) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a,b) => b[1]-a[1]);
}

function buildWeeklySeries(events, weeksBack){
  const today = startOfDay(new Date());
  const endWeek = weekStartSunday(today);
  const startWeek = addDays(endWeek, -(weeksBack-1)*7);

  // init all weeks with 0 so chart always has a continuous series
  const weekCounts = new Map();
  for(let d = new Date(startWeek); d <= endWeek; d = addDays(d, 7)){
    weekCounts.set(dateKeyLocal(d), 0);
  }

  for(const e of events){
    const ws = weekStartSunday(e.date);
    if(ws < startWeek || ws > endWeek) continue;
    const k = dateKeyLocal(ws);
    weekCounts.set(k, (weekCounts.get(k) || 0) + 1);
  }

  // label: M/D
  const out = [];
  for(const [k, v] of Array.from(weekCounts.entries()).sort((a,b)=>a[0].localeCompare(b[0]))){
    const d = new Date(k + "T00:00:00");
    const label = `${d.getMonth()+1}/${d.getDate()}`;
    out.push([label, v]);
  }
  return out;
}

function countSources(events){
  const counts = new Map();
  for(const e of events){
    const s = e.source || "Unknown";
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]);
}

async function renderAnalytics(parsed){
  await loadGoogle();

  const today = startOfDay(new Date());
  const cutoff52 = addDays(today, -52*7);

  const last52 = parsed.filter(e => startOfDay(e.date) >= cutoff52);
  const topLast52 = countTopSongs(last52).slice(0,10);
  const topAllTime = countTopSongs(parsed).slice(0,10);

  drawBar(topLast52, "chart-top10-played", "Top 10 — Last 52 Weeks");
  drawBar(topAllTime, "chart-top10-alltime", "Top 10 — All Time");

  const weekly = buildWeeklySeries(last52, 26);
  drawLine(weekly, "chart-weekly-trend", "Weekly Song Volume — Last 26 Weeks");

  const sources = countSources(last52);
  drawDonut(sources, "chart-source-mix", "Songbook / Source Mix — Last 52 Weeks");
}

// ===== Error Handling =====
function showError(message){
  const header = document.querySelector(".page-header");
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `<h2>Data Load Error</h2><p class="muted">${message}</p>`;
  header.insertAdjacentElement("afterend", div);
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    const rows = await fetchXlsxRows(SRC.setlist);
    const parsed = parseSetlistRows(rows);

    await renderSetlist(parsed);
    await renderAnalytics(parsed);

    // redraw on resize so charts stay crisp
    window.addEventListener("resize", () => renderAnalytics(parsed));
  }catch(err){
    console.error(err);
    showError(err?.message || "Unknown error loading spreadsheets.");
  }
});
