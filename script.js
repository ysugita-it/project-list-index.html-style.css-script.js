// ▼ 各シートの公開CSVURLをここに貼り付けてください
const SHEET_URLS = [
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=0&single=true&output=csv",       // シート1
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=1605259806&single=true&output=csv", // シート2
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=85247055&single=true&output=csv", // シート3
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=1678862542&single=true&output=csv", // シート4
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=1086509056&single=true&output=csv", // シート5
];

// =====================
// CSVパーサー
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
// データ取得（複数シート並列取得）
// =====================
Promise.all(SHEET_URLS.map(url => fetch(url).then(res => res.text())))
  .then(texts => {
    // ローディング非表示
    document.getElementById("loading").style.display = "none";

    const container = document.getElementById("projects");
    container.innerHTML = "";

    // 全シートの行をまとめて処理（各シートの1行目＝ヘッダーをスキップ）
    texts.forEach(text => {
      const rows = parseCSV(text);
      rows.slice(1).forEach(cols => {
      if (cols.length < 10) return;

      const clean = (v) => (v || "").trim().replace(/\s/g, "");

      const card = document.createElement("div");
      card.className = "card";

      const priceText = cols[1] || "";
      const price = parseInt(priceText.replace(/[^0-9]/g, "")) || 0;

      let salaryType = "";
      if (priceText.includes("時給")) salaryType = "時給";
      else if (priceText.includes("日給")) salaryType = "日給";
      else if (priceText.includes("月給")) salaryType = "月給";

      const hotVal = (cols[11] || "").trim().replace(/\s/g, "");
      const isHot = hotVal === "○" || hotVal === "〇" || hotVal.toLowerCase() === "o";
      card.dataset.hot = isHot ? "1" : "0";
      if (isHot) card.classList.add("card-hot");

      card.dataset.price = price;
      card.dataset.salaryType = salaryType;
      card.dataset.holiday = clean(cols[6]);
      card.dataset.experience = clean(cols[3]);
      card.dataset.area = clean(cols[4]);
      card.dataset.areaRaw = (cols[4] || "").trim();
      card.dataset.industry = clean(cols[8]);
      card.dataset.transport = clean(cols[2]);

      // キーワード検索用にデータ属性にテキストをまとめる
      card.dataset.searchText = [
        cols[0], cols[1], cols[2], cols[3],
        cols[4], cols[6], cols[7], cols[8], cols[9]
      ].join(" ").toLowerCase();

      const updatedAt = (cols[12] || "").trim();

      card.innerHTML = `
        <div class="card-header">
          <h2 style="font-weight:700;">${cols[0]}</h2>
          ${updatedAt ? `<span class="updated-at">${updatedAt}</span>` : ""}
        </div>
        <div class="meta">
          単価：${cols[1]}<br>
          交通費：${cols[2]}<br>
          担当：${cols[9]}　／　${cols[10]}
        </div>
        <div>${cols[7]}</div>
        <div class="badge-row">
          <span class="badge badge-industry">${cols[8]}</span>
          <span class="badge badge-area">${cols[4]}</span>
          <span class="badge badge-exp">${cols[3]}</span>
          <span class="badge badge-holiday">${cols[6]}</span>
          ${cols[5] ? `<span class="badge badge-days">${cols[5]}</span>` : ""}
        </div>
      `;

      container.appendChild(card);
    });
    }); // textsのforEach終了

    applyFilters();

    // エリア固有名詞タグを自動生成
    const areaSet = new Set();
    document.querySelectorAll(".card").forEach(card => {
      const raw = card.dataset.areaRaw || "";
      raw.split(/[、,，\s]+/).forEach(v => {
        const t = v.trim();
        if (t) areaSet.add(t);
      });
    });

    const areaDetailBox = document.getElementById("areaDetailTags");
    if (areaDetailBox) {
      areaSet.forEach(name => {
        const btn = document.createElement("button");
        btn.className = "tag";
        btn.dataset.name = "areaDetail";
        btn.dataset.value = name;
        btn.textContent = name;
        areaDetailBox.appendChild(btn);
      });
    }
  })
  .catch(() => {
    document.getElementById("loading").textContent = "データの取得に失敗しました。";
  });

// =====================
// タグ操作
// =====================
document.addEventListener("click", e => {
  if (e.target.classList.contains("tag")) {
    const name = e.target.dataset.name;

    if (name === "sort") {
      // 同じボタンを押したらオフ、別ボタンを押したら切り替え
      const isActive = e.target.classList.contains("active");
      document.querySelectorAll(`.tag[data-name="sort"]`)
        .forEach(t => t.classList.remove("active"));
      if (!isActive) e.target.classList.add("active");
      applyFilters();
      updateResetButton();
      return;
    }

    e.target.classList.toggle("active");
    applyFilters();
    updateResetButton();
  }
});

function getTagValues(name) {
  return Array.from(document.querySelectorAll(`.tag[data-name="${name}"].active`))
    .map(el => el.dataset.value.trim().replace(/\s/g, ""));
}

// =====================
// フィルター
// =====================
function applyFilters() {
  const keyword = (document.getElementById("search").value || "").toLowerCase();

  const holiday    = getTagValues("holiday");
  const experience = getTagValues("experience");
  const area       = getTagValues("area");
  const areaDetail = getTagValues("areaDetail");
  const industry   = getTagValues("industry");
  const transport  = getTagValues("transport");
  const salaryType = getTagValues("salaryType");
  const hot        = getTagValues("hot");
  const sort       = getTagValues("sort")[0];

  const cards = Array.from(document.querySelectorAll(".card"));
  let visibleCount = 0;

  cards.forEach(card => {
    // innerTextではなくdata属性を使用
    const text = card.dataset.searchText || "";

    const match =
      text.includes(keyword) &&
      (!holiday.length    || holiday.some(v    => card.dataset.holiday.includes(v))) &&
      (!experience.length || experience.some(v => card.dataset.experience === v)) &&
      (!area.length       || area.some(v       => card.dataset.area.includes(v))) &&
      (!areaDetail.length || areaDetail.some(v => (card.dataset.areaRaw || "").includes(v))) &&
      (!industry.length   || industry.some(v   => card.dataset.industry.includes(v))) &&
      (!transport.length  || transport.some(v  => card.dataset.transport.includes(v))) &&
      (!salaryType.length || salaryType.includes(card.dataset.salaryType)) &&
      (!hot.length        || hot.includes(card.dataset.hot));

    card.style.display = match ? "block" : "none";
    if (match) visibleCount++;
  });

  // 件数表示
  const countEl = document.getElementById("resultCount");
  if (cards.length > 0) {
    countEl.textContent = `${visibleCount} 件表示中`;
  }

  // 空状態表示
  const emptyEl = document.getElementById("emptyState");
  emptyEl.style.display = (cards.length > 0 && visibleCount === 0) ? "block" : "none";

  // ソート
  if (sort) {
    const container = document.getElementById("projects");
    const sorted = cards.sort((a, b) => {
      return sort === "asc"
        ? a.dataset.price - b.dataset.price
        : b.dataset.price - a.dataset.price;
    });
    sorted.forEach(c => container.appendChild(c));
  }
}

// =====================
// リセットボタン制御
// =====================
function updateResetButton() {
  const hasActive = document.querySelectorAll(".tag.active").length > 0;
  document.getElementById("resetFilter").style.display = hasActive ? "inline-flex" : "none";
}

document.getElementById("resetFilter").addEventListener("click", () => {
  document.querySelectorAll(".tag.active").forEach(t => t.classList.remove("active"));
  applyFilters();
  updateResetButton();
});

// =====================
// 検索入力
// =====================
document.getElementById("search").addEventListener("input", applyFilters);

// =====================
// トグルボタン（イベント重複なし）
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleFilter");
  const filterBox = document.getElementById("filterBox");

  if (!toggleBtn || !filterBox) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = filterBox.style.display === "none";
    filterBox.style.display = isHidden ? "block" : "none";
    toggleBtn.textContent = isHidden ? "▲ 検索条件を閉じる" : "▼ 検索条件の選択";
  });
});
