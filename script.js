const SRC = {
  setlist: "https://raw.githubusercontent.com/YSayaovong/Worship-Analytics-Dashboard-Song-Usage-Trends-KPI-Tracking/main/setlist/setlist.xlsx"
};

async function fetchXlsxRows(url){
  const res = await fetch(url + "?v=" + Date.now(), { cache:"no-store" });
  if(!res.ok) throw new Error("Failed to fetch spreadsheet.");
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, { type:"array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval:"" });
}

function parseRows(rows){
  return rows.map(r=>{
    const date = new Date(r.Date || r.date || r["Service Date"]);
    return {
      date,
      song:(r.Song || r.Title || "").trim(),
      topic:(r.Topic || "").trim(),
      source:(r.Source || r.Songbook || "Unknown").trim()
    };
  }).filter(r=>r.date && r.song);
}

function startOfDay(d){
  const x=new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function weekStart(d){
  const x=startOfDay(d);
  x.setDate(x.getDate()-x.getDay());
  return x;
}

function addDays(d,n){
  const x=new Date(d);
  x.setDate(x.getDate()+n);
  return x;
}

/* SETLIST */
function renderSetlist(data){
  const byDate={};
  data.forEach(r=>{
    const key=startOfDay(r.date).toISOString();
    if(!byDate[key]) byDate[key]=[];
    byDate[key].push(r);
  });

  const dates=Object.keys(byDate).map(d=>new Date(d)).sort((a,b)=>a-b);
  const today=startOfDay(new Date());

  const next=dates.find(d=>d>=today);
  const prev=[...dates].reverse().find(d=>d<today);

  function render(date,idHead,idBody){
    const head=document.getElementById(idHead);
    const body=document.getElementById(idBody);
    head.innerHTML="<tr><th>Date</th><th>Song</th><th>Topic</th></tr>";
    body.innerHTML="";

    if(!date){
      body.innerHTML="<tr><td colspan='3'>No Data</td></tr>";
      return;
    }

    byDate[startOfDay(date).toISOString()].forEach(r=>{
      body.innerHTML+=`
      <tr>
        <td>${date.toLocaleDateString()}</td>
        <td>${r.song}</td>
        <td>${r.topic}</td>
      </tr>`;
    });
  }

  render(next,"setlist-up-head","setlist-up-body");
  render(prev,"setlist-last-head","setlist-last-body");
}

/* ANALYTICS */
function countTop(data){
  const map={};
  data.forEach(r=>map[r.song]=(map[r.song]||0)+1);
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

function weeklySeries(data,weeks){
  const today=startOfDay(new Date());
  const end=weekStart(today);
  const start=addDays(end,-(weeks-1)*7);

  const map={};
  for(let d=new Date(start);d<=end;d=addDays(d,7)){
    map[d.toISOString()]=0;
  }

  data.forEach(r=>{
    const w=weekStart(r.date).toISOString();
    if(map[w]!==undefined) map[w]++;
  });

  return Object.entries(map)
    .sort()
    .map(([k,v])=>{
      const d=new Date(k);
      return [`${d.getMonth()+1}/${d.getDate()}`,v];
    });
}

async function renderCharts(data){
  await new Promise(res=>{
    google.charts.load("current",{packages:["corechart"]});
    google.charts.setOnLoadCallback(res);
  });

  const last52=data.filter(r=>r.date>=addDays(new Date(),-364));

  const top10=countTop(last52).slice(0,10);
  const topAll=countTop(data).slice(0,10);

  const bar=(arr,id,title)=>{
    const dt=google.visualization.arrayToDataTable([["Song","Plays"],...arr]);
    new google.visualization.BarChart(document.getElementById(id))
      .draw(dt,{title,legend:{position:"none"},bars:"horizontal"});
  };

  const line=(arr,id,title)=>{
    const dt=google.visualization.arrayToDataTable([["Week","Songs"],...arr]);
    new google.visualization.LineChart(document.getElementById(id))
      .draw(dt,{title});
  };

  const donut=(arr,id,title)=>{
    const map={};
    last52.forEach(r=>map[r.source]=(map[r.source]||0)+1);
    const dt=google.visualization.arrayToDataTable([
      ["Source","Count"],
      ...Object.entries(map)
    ]);
    new google.visualization.PieChart(document.getElementById(id))
      .draw(dt,{title,pieHole:0.4});
  };

  bar(top10,"chart-top10-played","Top 10 — Last 52 Weeks");
  bar(topAll,"chart-top10-alltime","Top 10 — All Time");
  line(weeklySeries(last52,26),"chart-weekly-trend","Weekly Song Volume — Last 26 Weeks");
  donut(last52,"chart-source-mix","Songbook / Source Mix — Last 52 Weeks");
}

/* INIT */
document.addEventListener("DOMContentLoaded",async()=>{
  try{
    const rows=await fetchXlsxRows(SRC.setlist);
    const parsed=parseRows(rows);
    renderSetlist(parsed);
    renderCharts(parsed);
    window.addEventListener("resize",()=>renderCharts(parsed));
  }catch(e){
    console.error(e);
  }
});
