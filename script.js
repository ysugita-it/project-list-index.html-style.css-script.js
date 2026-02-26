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
