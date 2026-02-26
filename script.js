const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2WSZGibHfo4AHqFYWbQHpLqqrCM-181WQpJx22zjPFKr9UzGRPd4fZhtnE4lTTPZ_WsIm7xJpj8wG/pub?output=csv";

fetch(sheetURL)
  .then(res => res.text())
  .then(data => {
    const rows = data.split("\n").slice(1);
    const container = document.getElementById("projects");

    rows.forEach(row => {
      const cols = row.split(",");
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

document.getElementById("search").addEventListener("input", function(){
  const keyword = this.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card=>{
    card.style.display =
      card.innerText.toLowerCase().includes(keyword)
        ? "block"
        : "none";
  });
});
