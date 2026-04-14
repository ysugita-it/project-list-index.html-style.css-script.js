const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?gid=0&single=true&output=csv";

fetch(sheetURL)
  .then(res => res.text())
  .then(data => {

    const rows = parseCSV(data);
    const container = document.getElementById("projects");
    container.innerHTML = "";

    rows.slice(1).forEach(cols => {
      if(cols.length < 10) return;

      const card = document.createElement("div");
card.className = "card";

card.dataset.holiday = cols[6];
card.dataset.experience = cols[3];
card.dataset.area = cols[4];
card.dataset.industry = cols[8];
card.dataset.transport = cols[2];
card.dataset.price = parseInt(cols[1].replace(/[^0-9]/g,"")) || 0;


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
  });

function parseCSV(text) {
  const rows = [];
  const lines = text.split("\n");

  lines.forEach(line => {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' ) {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    rows.push(result);
  });

  return rows;
}

document.getElementById("search").addEventListener("input", function(){
  const keyword = this.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card=>{
    card.style.display =
      card.innerText.toLowerCase().includes(keyword)
        ? "block"
        : "none";
  });
});

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", applyFilters);
  el.addEventListener("change", applyFilters);
});

function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name=${name}]:checked`))
    .map(el => el.value);
}

function applyFilters() {
  const keyword = document.getElementById("search").value.toLowerCase();

  const holiday = getChecked("holiday");
  const experience = getChecked("experience");
  const area = getChecked("area");
  const industry = getChecked("industry");
  const transport = getChecked("transport");

  const highPrice = document.getElementById("highPrice").checked;
  const sort = document.getElementById("sortPrice").value;

  let cards = Array.from(document.querySelectorAll(".card"));

  cards.forEach(card => {

    const matchKeyword = card.innerText.toLowerCase().includes(keyword);
    const matchHoliday = !holiday.length || holiday.includes(card.dataset.holiday);
    const matchExperience = !experience.length || experience.includes(card.dataset.experience);
    const matchArea = !area.length || area.some(a => card.dataset.area.includes(a));
    const matchIndustry = !industry.length || industry.some(i => card.dataset.industry.includes(i));
    const matchTransport = !transport.length || transport.includes(card.dataset.transport);

    const price = parseInt(card.dataset.price);
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
