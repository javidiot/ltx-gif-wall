window.addEventListener("load", function() {
  const dp = Array.from(document.querySelectorAll("button")).find(b => b.textContent && (b.textContent.includes("unknown date") || b.textContent.includes("全部")));
  if (!dp || document.getElementById("ltx-sort-bar")) return;
  const st = document.createElement("style");
  st.textContent = "#ltx-sort-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 16px 8px 16px;width:100%}#ltx-sort-bar button{background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.14);padding:3px 11px;height:26px;border-radius:999px;font-size:12px;cursor:pointer}#ltx-sort-bar button.active{background:#10b981;color:#fff;border-color:#10b981;font-weight:600}";
  document.head.appendChild(st);

  const bar = document.createElement("div");
  bar.id = "ltx-sort-bar";
  bar.innerHTML = '<button class="active" data-m="date-desc">日期(倒序)</button><button data-m="date-asc">日期(順序)</button><button data-m="name-asc">名字(A-Z)</button><button data-m="name-desc">名字(Z-A)</button><button data-m="code-asc">番號(A-Z)</button><button data-m="code-desc">番號(Z-A)</button><button id="ltxRnd" data-m="random">隨機</button>';
  if (dp.parentElement && dp.parentElement.parentElement) dp.parentElement.parentElement.appendChild(bar);
  else dp.parentElement.insertAdjacentElement("afterend", bar);

  const dEl = document.getElementById("gif-data");
  const metaMap = new Map();
  if (dEl) {
    try {
      JSON.parse(dEl.textContent || "[]").forEach((it, idx) => {
        const t = String(it.title || ""); let act = "", cd = "";
        const d = t.indexOf("·");
        if (d >= 0) {
          const r = t.substring(d + 1).trim();
          const op = r.lastIndexOf("("), cp = r.lastIndexOf(")");
          if (op > 0 && cp > op) { act = r.substring(0, op).trim(); cd = r.substring(op + 1, cp).trim().toUpperCase(); }
          else { act = r; }
        }
        metaMap.set(String(it.url || "").trim(), { idx: idx, date: String(it.date || ""), act: act, cd: cd });
      });
    } catch(e) {}
  }

  bar.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      bar.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const m = btn.dataset.m;
      const rnd = document.getElementById("ltxRnd");
      const grid = document.getElementById("grid") || document.querySelector(".grid");
      if (!grid) return;

      if (m === "random") {
        let seen = new Set(JSON.parse(localStorage.getItem("ltx_deck_final") || "[]"));
        const allUrls = Array.from(metaMap.keys());
        let unUrls = allUrls.filter(u => !seen.has(u));
        if (unUrls.length === 0) { seen.clear(); unUrls = allUrls.slice(); }
        for (let i = unUrls.length - 1; i > 0; i--) {
          const b = new Uint32Array(1); window.crypto.getRandomValues(b);
          const j = b.at(0) % (i + 1);
          const tmp = unUrls.at(i); unUrls.splice(i, 1, unUrls.at(j)); unUrls.splice(j, 1, tmp);
        }
        const batchUrls = unUrls.slice(0, 36);
        batchUrls.forEach(u => seen.add(u));
        localStorage.setItem("ltx_deck_final", JSON.stringify(Array.from(seen)));
        if (rnd) rnd.textContent = "隨機 (" + Math.max(0, unUrls.length - batchUrls.length) + "/" + allUrls.length + ")";

        const fullData = JSON.parse(dEl.textContent || "[]");
        const urlToObj = new Map(fullData.map(x => [x.url, x]));
        grid.innerHTML = "";
        batchUrls.forEach(u => {
          const it = urlToObj.get(u);
          if (!it) return;
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = '<img src="' + it.url + '" loading="lazy" style="width:100%;display:block;cursor:pointer;"><div style="padding:8px;font-size:12px;color:#d1d5db;">' + it.title + '</div>';
          card.onclick = () => window.open(it.link || it.url, "_blank");
          grid.appendChild(card);
        });
        return;
      }

      if (rnd) rnd.textContent = "隨機";
      const cards = Array.from(grid.children);
      cards.sort((a, b) => {
        const ua = a.querySelector("img") ? (a.querySelector("img").getAttribute("src") || "") : "";
        const ub = b.querySelector("img") ? (b.querySelector("img").getAttribute("src") || "") : "";
        const ma = metaMap.get(ua) || { idx: 9999, date: "", act: "", cd: "" };
        const mb = metaMap.get(ub) || { idx: 9999, date: "", act: "", cd: "" };
        if (m === "date-desc") return (mb.date === "unknown date" ? "0000" : mb.date).localeCompare(ma.date === "unknown date" ? "0000" : ma.date) || ma.idx - mb.idx;
        if (m === "date-asc") return (ma.date === "unknown date" ? "9999" : ma.date).localeCompare(mb.date === "unknown date" ? "9999" : mb.date) || mb.idx - ma.idx;
        if (m === "name-asc" || m === "name-desc") { if (!ma.act) return 1; if (!mb.act) return -1; const c = ma.act.localeCompare(mb.act, "ja"); return m === "name-asc" ? c : -c; }
        if (m === "code-asc" || m === "code-desc") { if (!ma.cd) return 1; if (!mb.cd) return -1; const c = ma.cd.localeCompare(mb.cd, "en", { numeric: true }); return m === "code-asc" ? c : -c; }
        return ma.idx - mb.idx;
      });
      cards.forEach(c => grid.appendChild(c));
    };
  });
});