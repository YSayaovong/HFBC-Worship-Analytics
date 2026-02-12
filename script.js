// ====== CONFIG: RAW sources (new repo) ======
const SRC = {
  announcements: "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/announcements/announcements.xlsx",
  members:       "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/members/members.xlsx",
  setlist:       "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/setlist/setlist.xlsx",
  addPractice:   "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/special_practice/special_practice.xlsx",
  training:      "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/special_practice/training.xlsx",
  bibleStudy:    "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/bible_study/bible_study.xlsx",
};

// ====== Utilities ======
async function fetchXlsxRows(rawUrl, sheet=0){
  const res = await fetch(rawUrl + "?v=" + Date.now());
  if(!res.ok) throw new Error("Fetch failed: " + rawUrl);
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, {type: "array"});
  const ws = typeof sheet==="number" ? wb.Sheets[wb.SheetNames[sheet]] : wb.Sheets[sheet] || wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function excelToDate(v){
  if(v==null||v==="") return null;

  // Excel serial
  if(typeof v==="number"){
    const d = XLSX.SSF.parse_date_code(v);
    if(!d) return null;
    return new Date(d.y, d.m-1, d.d, d.H||0, d.M||0, d.S||0);
  }

  // Handle common sheet formats safely: "1/4/2026" or "2026-01-04"
  const s = String(v).trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(s) : null;
  if(iso && !isNaN(iso.getTime())) return iso;

  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if(mdy){
    const mm = Number(mdy[1]);
    const dd = Number(mdy[2]);
    const yy = Number(mdy[3]);
    const dt = new Date(yy, mm-1, dd);
    return isNaN(dt.getTime()) ? null : dt;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const DAY_ABBR = ["Sun","Mon","Tues","Wed","Thurs","Fri","Sat"];
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
const fmtDateOnly = dt => `${DAY_ABBR[dt.getDay()]}, ${MONTH_ABBR[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;

const norm = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
function normMap(r){ const m={}; Object.keys(r||{}).forEach(k=>m[norm(k)]=r[k]); return m; }
function val(m, keys){ for(const k of keys){ const v=m[k]; if(v!=null && String(v)!=="") return v; } return ""; }

function startOfDay(d){
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function startOfWeekSunday(d){
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // Sunday start
  return x;
}

function addDays(d, n){
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ====== Weekly Practices ======
async function renderWeeklyPractices(){
  const tbody = document.getElementById("weekly-practice-body");
  if(!tbody) return;
  tbody.innerHTML = "";
  const now = new Date();

  function nextDow(target){
    const d = startOfDay(now);
    const delta = (target - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta);
    return d;
  }

  const thurs = nextDow(4);
  const sun   = nextDow(0);

  const rows = [
    { date: thurs, time: "6:00–8:00 PM" },
    { date: sun,   time: "8:40–9:30 AM" },
  ];

  rows.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${fmtDateOnly(r.date)}</td><td>${r.time}</td>`;
    tbody.appendChild(tr);
  });
}

// ====== Additional Practice ======
async function renderAdditionalPractice(){
  const tbody = document.getElementById("additional-practice-body");
  if(!tbody) return;
  tbody.innerHTML="";
  try{
    const rows = await fetchXlsxRows(SRC.addPractice);
    rows.forEach(r=>{
      const m = normMap(r);
      const d = excelToDate(val(m, ["date","day","servicedate"]));
      const t = val(m, ["time","starttime","practice"]);
      if(!d||!t) return;
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${fmtDateOnly(d)}</td><td>${t}</td>`;
      tbody.appendChild(tr);
    });
    if(!tbody.children.length) tbody.innerHTML = `<tr><td colspan="2">No additional practices listed.</td></tr>`;
  }catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="2">Could not load special practice sheet.</td></tr>`;
  }
}

// ====== Training ======
async function renderTraining(){
  const tbody = document.getElementById("training-body");
  if(!tbody) return;
  tbody.innerHTML="";
  try{
    const rows = await fetchXlsxRows(SRC.training);
    rows.forEach(r=>{
      const m = normMap(r);
      const d = excelToDate(val(m, ["date","day"]));
      const t = val(m, ["time","starttime"]);
      const passage = val(m, ["passage","topic","study"]);
      const verse = val(m, ["bibleverse","verse","reference"]);
      if(!d || (!t && !passage && !verse)) return;
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${fmtDateOnly(d)}</td><td>${t||""}</td><td>${passage||""}</td><td>${verse||""}</td>`;
      tbody.appendChild(tr);
    });
    if(!tbody.children.length) tbody.innerHTML = `<tr><td colspan="4">No training entries found.</td></tr>`;
  }catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4">Could not load training sheet.</td></tr>`;
  }
}

// ====== Members ======
async function renderMembers(){
  const leaderList = document.getElementById("leader-list");
  const musicianList = document.getElementById("musician-list");
  const singersList = document.getElementById("singers-list");
  if(!leaderList||!musicianList||!singersList) return;
  leaderList.innerHTML = musicianList.innerHTML = singersList.innerHTML = "";
  try{
    const rows = await fetchXlsxRows(SRC.members);
    const leaders=[], musicians=[], singers=[];
    rows.forEach(r=>{
      const m = normMap(r);
      const name = val(m, ["name","member","person"]) || "";
      const role = (val(m, ["role","position","type"]) || "").toLowerCase();
      if(!name) return;
      if(role.includes("leader")) leaders.push(name);
      else if(role.includes("singer") || role.includes("vocal")) singers.push(name);
      else musicians.push(name);
    });
    const addAll=(ul,arr)=>{
      if(!arr.length) ul.innerHTML="<li class='muted'>None listed</li>";
      else arr.forEach(n=>{ const li=document.createElement("li"); li.textContent=n; ul.appendChild(li); });
    };
    addAll(leaderList, leaders);
    addAll(musicianList, musicians);
    addAll(singersList, singers);
  }catch(e){
    console.error(e);
    leaderList.innerHTML = musicianList.innerHTML = singersList.innerHTML = "<li class='muted'>Could not load members sheet.</li>";
  }
}

// ====== Announcements ======
async function renderAnnouncements(){
  const tbody = document.getElementById("announcements-body");
  if(!tbody) return;
  tbody.innerHTML="";
  try{
    const rows = await fetchXlsxRows(SRC.announcements);
    const today = startOfDay(new Date());
    const limit = 31*24*60*60*1000;

    const items = rows.map(r=>{
      const m = normMap(r);
      const d = excelToDate(val(m, ["date","day"]));
      const en = val(m, ["announcement","announcementenglish","english","announcement_(english)"]);
      const hm = val(m, ["hmong","lus_tshaj_tawm","lustshajtawm","lus","tshaj"]) || r["LUS TSHAJ TAWM"] || "";
      return { d, en, hm };
    }).filter(x=>x.d && (today - startOfDay(x.d)) <= limit)
      .sort((a,b)=>b.d-a.d);

    items.forEach(it=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${fmtDateOnly(it.d)}</td><td>${it.en||""}</td><td>${it.hm||""}</td>`;
      tbody.appendChild(tr);
    });

    if(!tbody.children.length) tbody.innerHTML = `<tr><td colspan="3">No announcements from the last 31 days.</td></tr>`;
  }catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="3">Could not load announcements sheet.</td></tr>`;
  }
}

// ====== Bible Study ======
async function renderBibleStudy(){
  const tbody=document.getElementById("bible-study-body");
  if(!tbody) return;
  tbody.innerHTML="";
  try{
    const rows = await fetchXlsxRows(SRC.bibleStudy);
    const now = new Date();
    const end = addDays(startOfWeekSunday(now), 6);
    end.setHours(23,59,59,999);
    const prev3 = addDays(startOfWeekSunday(now), -21);

    const items = rows.map(r=>{
      const m=normMap(r);
      const d=excelToDate(val(m, ["date","day"]));
      const topic=val(m, ["topic","passage","study"]);
      const verse=val(m, ["bibleverse","verse","reference"]);
      return {d,topic,verse};
    }).filter(x=>x.d && x.d>=prev3 && x.d<=end)
      .sort((a,b)=>b.d-a.d);

    items.forEach(it=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${fmtDateOnly(it.d)}</td><td>${it.topic||""}</td><td>${it.verse||""}</td>`;
      tbody.appendChild(tr);
    });

    if(!tbody.children.length) tbody.innerHTML = `<tr><td colspan="3">No bible study entries for the last 3 weeks.</td></tr>`;
  }catch(e){
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="3">Could not load bible study sheet.</td></tr>`;
  }
}

// ====== Setlist (FIXED: nearest upcoming + nearest previous service) ======
function normSetlistRow(r){
  const m=normMap(r);
  const date=excelToDate(val(m, ["date","day","servicedate"]));

  // Your sheet might put the song title under different headers.
  // Keep it robust.
  const song=String(val(m, ["song","title","songs","hymn","hymn_title"])).trim();

  const topic=String(val(m, ["topic","notes","theme"])).trim();

  // Optional “book/source” column for analytics
  const source=String(val(m, ["book","source","songbook","category","collection"])).trim();

  return {date,song,topic,source};
}

function dedupeByTitle(list){
  const seen=new Set();
  return list.filter(it=>{
    const k=(it.song||"").toLowerCase().trim();
    if(!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function renderSetlist(){
  const upHead=document.getElementById("setlist-up-head");
  const upBody=document.getElementById("setlist-up-body");
  const lsHead=document.getElementById("setlist-last-head");
  const lsBody=document.getElementById("setlist-last-body");
  if(!upHead||!upBody||!lsHead||!lsBody) return;

  const renderBlock=(dateObj, headEl, bodyEl, msg)=>{
    headEl.innerHTML="<tr><th>Date</th><th>Song</th><th>Topic</th></tr>";
    bodyEl.innerHTML="";

    if(!dateObj){
      bodyEl.innerHTML=`<tr><td colspan='3'>${msg}</td></tr>`;
      return;
    }

    const k = dateObj.toISOString().slice(0,10);
    const list = dedupeByTitle(byDate.get(k) || []);

    if(!list.length){
      bodyEl.innerHTML=`<tr><td colspan='3'>${msg}</td></tr>`;
      return;
    }

    list.forEach(({date,song,topic})=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${fmtDateOnly(date)}</td><td>${song}</td><td>${topic||""}</td>`;
      bodyEl.appendChild(tr);
    });
  };

  let byDate;

  try{
    const rows = (await fetchXlsxRows(SRC.setlist))
      .map(normSetlistRow)
      .filter(x=>x.date && x.song);

    byDate = new Map();
    for(const r of rows){
      const k = startOfDay(r.date).toISOString().slice(0,10);
      if(!byDate.has(k)) byDate.set(k, []);
      byDate.get(k).push(r);
    }

    const dates = Array.from(byDate.keys())
      .map(d => new Date(d))
      .sort((a,b)=>a-b);

    const today = startOfDay(new Date());

    // Nearest upcoming (>= today) and nearest previous (< today)
    const next = dates.find(d => d >= today) || null;
    const prev = [...dates].reverse().find(d => d < today) || null;

    renderBlock(next, upHead, upBody, "No upcoming service setlist found.");
    renderBlock(prev, lsHead, lsBody, "No previous service setlist found.");

  }catch(e){
    console.error("Setlist error:", e);
    upHead.innerHTML = lsHead.innerHTML = "<tr><th>Date</th><th>Song</th><th>Topic</th></tr>";
    upBody.innerHTML = "<tr><td colspan='3'>Could not load setlist.</td></tr>";
    lsBody.innerHTML = "<tr><td colspan='3'>Could not load setlist.</td></tr>";
  }
}

// ====== Charts ======
function loadGoogle(){
  return new Promise(res=>{
    google.charts.load("current",{packages:["corechart"]});
    google.charts.setOnLoadCallback(res);
  });
}

function isExcludedSong(name){
  const s=String(name||"").trim().toLowerCase();
  return !s || s==="na" || s==="n/a" || s.includes("church close");
}

function inLastWeeks(d, w){
  const today = startOfDay(new Date());
  const start = addDays(today, -(w*7 - 1));
  return d>=start && d<=today;
}

function pickSource(m, rawRow){
  // Pull from any of these columns if present:
  const s = String(val(m, ["book","source","songbook","category","collection"])).trim();
  if(s) return s;

  // If the original row has a header not normalized, try common keys:
  // (this helps when headers have spaces/case)
  const direct = rawRow["Book"] || rawRow["BOOK"] || rawRow["Songbook"] || rawRow["SOURCE"];
  return String(direct || "").trim();
}

async function computeCountsWindow(allRows, weeks){
  // song counts (unique per service date)
  const byDate = new Map();
  const titleCase = new Map();

  // source counts (raw row counts; not deduped per date)
  const sourceCounts = new Map();

  allRows.forEach(r=>{
    const m = normMap(r);
    const d = excelToDate(val(m, ["date","day","servicedate"]));
    const t = String(val(m, ["song","title","songs","hymn","hymn_title"])).trim();
    const src = pickSource(m, r);

    if(!d) return;
    if(!(weeks>=9999 || inLastWeeks(startOfDay(d), weeks))) return;
    if(isExcludedSong(t)) return;

    // unique songs per service date
    const k = startOfDay(d).toISOString().slice(0,10);
    if(!byDate.has(k)) byDate.set(k, new Set());
    byDate.get(k).add(t.toLowerCase());

    // title casing map
    const lk = t.toLowerCase();
    if(!titleCase.has(lk)) titleCase.set(lk, t);

    // source mix
    if(src){
      const key = src.trim();
      sourceCounts.set(key, (sourceCounts.get(key)||0) + 1);
    }
  });

  const counts = new Map();
  byDate.forEach(set => {
    set.forEach(t => counts.set(t, (counts.get(t)||0) + 1));
  });

  return { counts, titleCase, sourceCounts };
}

function drawTop10Bar(dataArray, chartId, tableId){
  const el = document.getElementById(chartId);
  const tbody = document.getElementById(tableId);

  // Table
  if(tbody){
    tbody.innerHTML="";
    if(!dataArray.length){
      tbody.innerHTML="<tr><td colspan='2'>No data found.</td></tr>";
    }else{
      dataArray.forEach(([name,plays])=>{
        const tr=document.createElement("tr");
        tr.innerHTML=`<td>${name}</td><td>${plays}</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // Chart
  if(!el) return;
  if(!dataArray.length){
    el.innerHTML="No data.";
    return;
  }

  const data = google.visualization.arrayToDataTable([
    ["Song","Plays"],
    ...dataArray
  ]);

  const opts = {
    backgroundColor: "transparent",
    legend: { position: "none" },
    chartArea: { width: "65%", height: "80%" },
    hAxis: { title: "Plays", minValue: 0 },
    vAxis: { title: "" },
    // Make it horizontal
    bars: "horizontal",
  };

  // BarChart is horizontal
  new google.visualization.BarChart(el).draw(data, opts);
}

function drawWeeklyTrend(weeklyPairs, chartId){
  const el = document.getElementById(chartId);
  if(!el) return;

  if(!weeklyPairs.length){
    el.innerHTML="No data.";
    return;
  }

  const data = google.visualization.arrayToDataTable([
    ["Week Starting", "Songs Listed"],
    ...weeklyPairs
  ]);

  const opts = {
    backgroundColor: "transparent",
    legend: { position: "none" },
    chartArea: { width: "80%", height: "75%" },
    hAxis: { slantedText: true, slantedTextAngle: 30 },
    vAxis: { minValue: 0 }
  };

  new google.visualization.LineChart(el).draw(data, opts);
}

function drawSourceDonut(sourcePairs, chartId){
  const el = document.getElementById(chartId);
  if(!el) return;

  if(!sourcePairs.length){
    el.innerHTML="No source data found (add a Book/Source column).";
    return;
  }

  const data = google.visualization.arrayToDataTable([
    ["Source","Count"],
    ...sourcePairs
  ]);

  const opts = {
    backgroundColor: "transparent",
    legend: { position: "right", textStyle: { color: "#e5e7eb" } },
    pieHole: 0.45,
    chartArea: { width: "90%", height: "85%" }
  };

  new google.visualization.PieChart(el).draw(data, opts);
}

function buildWeeklyTrendRows(rawRows, weeksBack=26){
  // Count total songs listed per week (not unique)
  const today = startOfDay(new Date());
  const start = addDays(today, -(weeksBack*7 - 1));

  const weekMap = new Map(); // weekStartISO -> count
  rawRows.forEach(r=>{
    const m = normMap(r);
    const d = excelToDate(val(m, ["date","day","servicedate"]));
    const t = String(val(m, ["song","title","songs","hymn","hymn_title"])).trim();
    if(!d || isExcludedSong(t)) return;

    const dd = startOfDay(d);
    if(dd < start || dd > today) return;

    const wk = startOfWeekSunday(dd).toISOString().slice(0,10);
    weekMap.set(wk, (weekMap.get(wk)||0) + 1);
  });

  // Convert to sorted array with nicer labels
  const keys = Array.from(weekMap.keys()).sort((a,b)=>new Date(a)-new Date(b));
  return keys.map(k => {
    const d = new Date(k);
    return [ `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`, weekMap.get(k) ];
  });
}

async function renderAnalytics(){
  await loadGoogle();

  const slRows = await fetchXlsxRows(SRC.setlist);

  // Top 10 bars (52w + all)
  const w = await computeCountsWindow(slRows, 52);
  const a = await computeCountsWindow(slRows, 9999);

  const topW = Array.from(w.counts.entries())
    .map(([k,v])=>[w.titleCase.get(k)||k, v])
    .sort((x,y)=>y[1]-x[1] || x[0].localeCompare(y[0]))
    .slice(0,10);

  const topA = Array.from(a.counts.entries())
    .map(([k,v])=>[a.titleCase.get(k)||k, v])
    .sort((x,y)=>y[1]-x[1] || x[0].localeCompare(y[0]))
    .slice(0,10);

  drawTop10Bar(topW, "chart-top10-played", "table-top10-window");
  drawTop10Bar(topA, "chart-top10-alltime", "table-top10-alltime");

  // Weekly trend (26 weeks)
  const weeklyTrend = buildWeeklyTrendRows(slRows, 26);
  drawWeeklyTrend(weeklyTrend, "chart-weekly-trend");

  // Source mix (52 weeks) - show top sources
  const srcPairs = Array.from(w.sourceCounts.entries())
    .sort((x,y)=>y[1]-x[1])
    .slice(0,8); // keep donut readable

  drawSourceDonut(srcPairs, "chart-source-mix");
}

// ====== Init ======
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await renderWeeklyPractices();
    await Promise.all([
      renderAdditionalPractice(),
      renderTraining(),
      renderMembers(),
      renderAnnouncements(),
      renderBibleStudy(),
      renderSetlist()
    ]);
    await renderAnalytics();
  } catch(e) {
    console.error("Init error:", e);
  }
});
