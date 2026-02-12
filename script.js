// ===== CONFIG =====
const SRC = {
  setlist: "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/setlist/setlist.xlsx"
};

// ===== Utilities =====
async function fetchXlsxRows(rawUrl){
  const res = await fetch(rawUrl + "?v=" + Date.now());
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, {type: "array"});
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function excelToDate(v){
  if(typeof v === "number"){
    const d = XLSX.SSF.parse_date_code(v);
    return new Date(d.y, d.m-1, d.d);
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

function startOfDay(d){
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function startOfWeekSunday(d){
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

// ===== Setlist (Nearest upcoming + previous) =====
async function renderSetlist(){
  const upHead=document.getElementById("setlist-up-head");
  const upBody=document.getElementById("setlist-up-body");
  const lsHead=document.getElementById("setlist-last-head");
  const lsBody=document.getElementById("setlist-last-body");

  const rows = await fetchXlsxRows(SRC.setlist);
  const parsed = rows.map(r=>{
    const date = excelToDate(r.Date || r.date);
    const song = r.Song || r.song;
    const topic = r.Topic || r.topic;
    return {date,song,topic};
  }).filter(x=>x.date && x.song);

  const byDate = {};
  parsed.forEach(r=>{
    const k = startOfDay(r.date).toISOString();
    if(!byDate[k]) byDate[k] = [];
    byDate[k].push(r);
  });

  const dates = Object.keys(byDate).map(d=>new Date(d)).sort((a,b)=>a-b);
  const today = startOfDay(new Date());

  const next = dates.find(d=>d>=today);
  const prev = [...dates].reverse().find(d=>d<today);

  function renderBlock(dateObj, head, body){
    head.innerHTML = "<tr><th>Date</th><th>Song</th><th>Topic</th></tr>";
    body.innerHTML = "";
    if(!dateObj){
      body.innerHTML = "<tr><td colspan='3'>No data</td></tr>";
      return;
    }
    const list = byDate[startOfDay(dateObj).toISOString()];
    list.forEach(r=>{
      body.innerHTML += `<tr><td>${r.date.toDateString()}</td><td>${r.song}</td><td>${r.topic||""}</td></tr>`;
    });
  }

  renderBlock(next, upHead, upBody);
  renderBlock(prev, lsHead, lsBody);

  return parsed;
}

// ===== Charts =====
function loadGoogle(){
  return new Promise(res=>{
    google.charts.load("current",{packages:["corechart"]});
    google.charts.setOnLoadCallback(res);
  });
}

function drawBar(dataArray, elementId){
  const data = google.visualization.arrayToDataTable([
    ["Song","Plays"],
    ...dataArray
  ]);
  const options = {
    legend: { position: "none" },
    chartArea: { width: "65%", height: "80%" },
    bars: "horizontal"
  };
  new google.visualization.BarChart(document.getElementById(elementId)).draw(data, options);
}

function drawLine(dataArray, elementId){
  const data = google.visualization.arrayToDataTable([
    ["Week","Songs"],
    ...dataArray
  ]);
  new google.visualization.LineChart(document.getElementById(elementId)).draw(data, {});
}

function drawDonut(dataArray, elementId){
  const data = google.visualization.arrayToDataTable([
    ["Source","Count"],
    ...dataArray
  ]);
  new google.visualization.PieChart(document.getElementById(elementId)).draw(data, {pieHole:0.4});
}

async function renderAnalytics(){
  await loadGoogle();
  const rows = await fetchXlsxRows(SRC.setlist);

  const counts = {};
  rows.forEach(r=>{
    const song = r.Song || r.song;
    if(!song) return;
    counts[song] = (counts[song]||0)+1;
  });

  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  drawBar(sorted.slice(0,10), "chart-top10-played");
  drawBar(sorted.slice(0,10), "chart-top10-alltime");

  drawLine([["Example",5]], "chart-weekly-trend");
  drawDonut([["HBNA Songbook",10],["Contemporary",4]], "chart-source-mix");
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async ()=>{
  await renderSetlist();
  await renderAnalytics();
});
