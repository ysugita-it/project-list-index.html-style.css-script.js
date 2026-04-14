const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=0&single=true&output=csv";

fetch(sheetURL)
  .then(res => res.text())
  .then(text => {

    const rows = parseCSV(text);
    const container = document.getElementById("projects");
    container.innerHTML = "";

    rows.slice(1).forEach(cols => {
      if(cols.length < 10) return;

      const card = document.createElement("div");
      card.className = "card";

      // 🔥 データ整形（ズレ対策：空白・改行除去）
      const clean = (val) => (val || "").trim().replace(/\s/g, "");

      const price = parseInt((cols[1] || "").replace(/[^0-9]/g,"")) || 0;

      card.dataset.holiday = clean(cols[6]);
      card.dataset.experience = clean(cols[3]);
      card.dataset.area = clean(cols[4]);
      card.dataset.industry = clean(cols[8]);
      card.dataset.transport = clean(cols[2]);
      card.dataset.price = price;

      // 表示
      card.innerHTML = `
        <h2>${cols[0]}</h2>
        <div class="meta">
          単価：${cols[1]}<br>
          交通費：${cols[2]}<br>
          経験有無：${cols[3]}<br>
          エリア：${cols[4]}<br>
          稼働日数：${cols[5]}<br>
          休み：${cols[6]}<br>
          業種：${cols[8]}<br>
          担当：${cols[9]}
        </div>
        <div>
          <strong>業務内容</strong><br>
          ${cols[7]}
        </div>
      `;

      container.appendChild(card);
    });

    // 初回実行（重要）
    applyFilters();
  });


// =====================
// CSVパーサー（改行・カンマ対応）
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
// フィルター処理
// =====================
document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", applyFilters);
  el.addEventListener("change", applyFilters);
});

function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name=${name}]:checked`))
    .map(el => el.value.trim().replace(/\s/g, ""));
}

function applyFilters() {

  const keyword = (document.getElementById("search").value || "").toLowerCase().trim();

  const holiday = getChecked("holiday");
  const experience = getChecked("experience");
  const area = getChecked("area");
  const industry = getChecked("industry");
  const transport = getChecked("transport");

  const highPrice = document.getElementById("highPrice").checked;
  const sort = document.getElementById("sortPrice").value;

  let cards = Array.from(document.querySelectorAll(".card"));

  cards.forEach(card => {

    const text = card.innerText.toLowerCase();

    const matchKeyword = text.includes(keyword);

    // 🔥 完全ゆる一致（ズレ対策）
    const matchHoliday = !holiday.length || holiday.some(h => card.dataset.holiday.includes(h));
    const matchExperience = !experience.length || experience.some(e => card.dataset.experience.includes(e));
    const matchArea = !area.length || area.some(a => card.dataset.area.includes(a));
    const matchIndustry = !industry.length || industry.some(i => card.dataset.industry.includes(i));
    const matchTransport = !transport.length || transport.some(t => card.dataset.transport.includes(t));

    const price = parseInt(card.dataset.price) || 0;
    const matchHighPrice = !highPrice || (price >= 2200 || price >= 400000);

    card.style.display =
      matchKeyword &&
      matchHoliday &&
      matchExperience &&
      matchArea &&
      matchIndustry &&
      matchTransport &&
      matchHighPrice
        ? "block"
        : "none";
  });

  // ソート
  if(sort) {
    const container = document.getElementById("projects");
    const sorted = cards.sort((a,b) => {
      return sort === "asc"
        ? a.dataset.price - b.dataset.price
        : b.dataset.price - a.dataset.price;
    });

    sorted.forEach(card => container.appendChild(card));
  }
}
