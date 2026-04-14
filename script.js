const sheetURL = "YOUR_CSV_URL";

// =====================
// CSVパーサー（完全版）
// =====================
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (current || row.length) {
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

// =====================
// データ取得
// =====================
fetch(sheetURL)
  .then(res => res.text())
  .then(text => {

    const rows = parseCSV(text);
    const container = document.getElementById("projects");
    container.innerHTML = "";

    rows.slice(1).forEach(cols => {
      if(cols.length < 10) return;

      const clean = (v) => (v || "").trim().replace(/\s/g,"");

      const card = document.createElement("div");
      card.className = "card";

      const priceText = cols[1] || "";
      const price = parseInt(priceText.replace(/[^0-9]/g,"")) || 0;

      // 単価種別
      let salaryType = "";
      if(priceText.includes("時給")) salaryType = "時給";
      else if(priceText.includes("日給")) salaryType = "日給";
      else if(priceText.includes("月給")) salaryType = "月給";

      card.dataset.price = price;
      card.dataset.salaryType = salaryType;
      card.dataset.holiday = clean(cols[6]);
      card.dataset.experience = clean(cols[3]);
      card.dataset.area = clean(cols[4]);
      card.dataset.industry = clean(cols[8]);
      card.dataset.transport = clean(cols[2]);

      card.innerHTML = `
        <h2>${cols[0]}</h2>
        <div class="meta">
          単価：${cols[1]}<br>
          交通費：${cols[2]}<br>
          経験：${cols[3]}<br>
          エリア：${cols[4]}<br>
          休み：${cols[6]}<br>
          業種：${cols[8]}<br>
          担当：${cols[9]}
        </div>
        <div>${cols[7]}</div>
      `;

      container.appendChild(card);
    });

    applyFilters();
  });

// =====================
// タグ操作
// =====================
document.addEventListener("click", e => {
  if(e.target.classList.contains("tag")){
    const name = e.target.dataset.name;

    if(name === "sort"){
      document.querySelectorAll(`.tag[data-name="sort"]`)
        .forEach(t => t.classList.remove("active"));
    }

    e.target.classList.toggle("active");
    applyFilters();
  }
});

function getTagValues(name){
  return Array.from(document.querySelectorAll(`.tag[data-name="${name}"].active`))
    .map(el => el.dataset.value.trim().replace(/\s/g,""));
}

// =====================
// フィルター
// =====================
function applyFilters(){

  const keyword = (document.getElementById("search").value || "").toLowerCase();

  const holiday = getTagValues("holiday");
  const experience = getTagValues("experience");
  const area = getTagValues("area");
  const industry = getTagValues("industry");
  const transport = getTagValues("transport");
  const salaryType = getTagValues("salaryType");
  const sort = getTagValues("sort")[0];

  let cards = Array.from(document.querySelectorAll(".card"));

  cards.forEach(card => {

    const text = card.innerText.toLowerCase();

    const match =
      text.includes(keyword) &&
      (!holiday.length || holiday.some(v => card.dataset.holiday.includes(v))) &&
      (!experience.length || experience.some(v => card.dataset.experience.includes(v))) &&
      (!area.length || area.some(v => card.dataset.area.includes(v))) &&
      (!industry.length || industry.some(v => card.dataset.industry.includes(v))) &&
      (!transport.length || transport.some(v => card.dataset.transport.includes(v))) &&
      (!salaryType.length || salaryType.includes(card.dataset.salaryType));

    card.style.display = match ? "block" : "none";
  });

  // ソート
  if(sort){
    const container = document.getElementById("projects");
    const sorted = cards.sort((a,b)=>{
      return sort === "asc"
        ? a.dataset.price - b.dataset.price
        : b.dataset.price - a.dataset.price;
    });
    sorted.forEach(c => container.appendChild(c));
  }
}
