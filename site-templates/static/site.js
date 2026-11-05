// theme toggle, citation block and header search from the Registry of Type Design
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Kāmodī, Kamodi and kaamodi all fold to "kamodi". v and b count as one letter, so do sh and s, ch and c
// doubled letters count once, a final y is i (Mohanty, Mohanti), and Pattanayaka, Patnaik, Pattnaik and the rest are one surname
// in Odia, joiners are dropped and ଵ and ୱ count as ବ
function fold(s) {
  return s
    .normalize("NFD")
    .replace(/[\u200c\u200d]/g, "")
    .replace(/[ଵୱ]/g, "ବ")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/v/g, "b")
    .replace(/sh/g, "s")
    .replace(/c+h+/g, "c")
    .replace(/aa+/g, "a")
    .replace(/ee+/g, "i")
    .replace(/oo+/g, "u")
    .replace(/([b-df-hj-np-tw-z])\1+/g, "$1")
    .replace(/y\b/g, "i")
    .replace(/\bpata?na(?:i|ya)ka?\b/g, "patnaik")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

function matches(query, item) {
  var tokens = fold(query).split(" ").filter(Boolean);
  if (!tokens.length) return false;
  return [item.title].concat(item.alt || []).some(function (name) {
    var target = fold(name);
    return tokens.every(function (tok) { return target.indexOf(tok) !== -1; });
  });
}

document.querySelectorAll(".copy-id").forEach(function (btn) {
  btn.addEventListener("click", function () {
    navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
      btn.classList.add("copied");
      setTimeout(function () { btn.classList.remove("copied"); }, 1200);
    });
  });
});

document.querySelectorAll(".citation-block").forEach(function (block) {
  var citations = JSON.parse(block.getAttribute("data-citation"));
  var now = new Date();
  var accessed = now.toLocaleDateString(document.documentElement.lang, { year: "numeric", month: "long", day: "numeric" });
  var accessedIso = now.toISOString().slice(0, 10);
  var select = block.querySelector(".citation-style");
  var pre = block.querySelector(".citation-text");
  var copyBtn = block.querySelector(".citation-copy");
  function fill(text) {
    return text.replaceAll("__ACCESSED_ISO__", accessedIso).replaceAll("__ACCESSED__", accessed);
  }
  function render() {
    var text = fill(citations[select.value]);
    pre.textContent = text;
    copyBtn.setAttribute("data-copy", text);
  }
  select.addEventListener("change", render);
  render();
  block.querySelector(".citation-download").addEventListener("click", function () {
    var blob = new Blob([fill(citations.bibtex)], { type: "application/x-bibtex" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = block.getAttribute("data-id") + ".bib";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});

(function () {
  var input = document.getElementById("header-search-input");
  if (!input) return;
  var wrap = input.closest(".header-search-wrap");
  var form = input.closest("form");
  var results = document.getElementById("header-search-results");
  var clearBtn = document.getElementById("header-search-clear");
  var kinds = JSON.parse(form.getAttribute("data-kinds"));
  var indexPromise = null;
  var textPromise = null;
  var MAX_RESULTS = 8;

  function loadIndex() {
    indexPromise = indexPromise || fetch(form.dataset.index).then(function (r) { return r.json(); });
    return indexPromise;
  }

  function loadText() {
    textPromise = textPromise || fetch(form.dataset.text).then(function (r) { return r.json(); }).then(function (songs) {
      songs.forEach(function (song) { song.folded = song.lines.map(fold); });
      return songs;
    });
    return textPromise;
  }

  function find(q) {
    return loadIndex().then(function (index) {
      var folded = fold(q);
      var hits = index.filter(function (item) { return item.id === q.trim() || matches(q, item); });
      // names that start with the query come first
      return hits.sort(function (a, b) {
        return (fold(b.title).indexOf(folded) === 0) - (fold(a.title).indexOf(folded) === 0);
      });
    });
  }

  // names first, then songs with a line holding every word of the query
  function findAll(q) {
    return Promise.all([find(q), loadIndex(), loadText()]).then(function (got) {
      var hits = got[0];
      var tokens = fold(q).split(" ").filter(Boolean);
      if (!tokens.length) return hits;
      var seen = {};
      hits.forEach(function (h) { seen[h.id] = true; });
      var byId = {};
      got[1].forEach(function (item) { byId[item.id] = item; });
      got[2].forEach(function (song) {
        if (seen[song.id] || !byId[song.id]) return;
        for (var i = 0; i < song.folded.length; i++) {
          var line = song.folded[i];
          if (tokens.every(function (tok) { return line.indexOf(tok) !== -1; })) {
            hits.push({ id: song.id, kind: byId[song.id].kind, title: byId[song.id].title, url: byId[song.id].url, line: song.lines[i] });
            return;
          }
        }
      });
      return hits;
    });
  }

  function hide() {
    results.hidden = true;
    results.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
  }

  function show(hits, q) {
    if (!hits.length) {
      results.innerHTML = '<p class="no-matches">' + escapeHtml(form.getAttribute("data-none")).replace("{q}", escapeHtml(q)) + "</p>";
    } else {
      results.innerHTML = "<ul>" + hits.slice(0, MAX_RESULTS).map(function (m) {
        var line = m.line ? '<span class="line" lang="or">' + escapeHtml(m.line) + "</span>" : "";
        return '<li><a href="' + escapeHtml(m.url) + '"><span class="name">' + escapeHtml(m.title) + line + '</span><span class="kind-tag">' + escapeHtml(kinds[m.kind] || m.kind) + "</span></a></li>";
      }).join("") + "</ul>";
    }
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  input.addEventListener("input", function () {
    clearBtn.hidden = !input.value;
    var q = input.value.trim();
    if (!q) return hide();
    find(q).then(function (hits) {
      if (input.value.trim() === q && hits.length) show(hits, q);
    });
    findAll(q).then(function (hits) {
      if (input.value.trim() === q) show(hits, q);
    });
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hide();
  });

  clearBtn.addEventListener("click", function () {
    input.value = "";
    clearBtn.hidden = true;
    hide();
    input.focus();
  });

  wrap.addEventListener("focusout", function (e) {
    if (!wrap.contains(e.relatedTarget)) hide();
  });

  // Enter opens the best match
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    findAll(q).then(function (hits) {
      if (hits.length) window.location.href = hits[0].url;
      else show(hits, q);
    });
  });
})();

(function () {
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  function isDark() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function updateLabel() {
    toggle.setAttribute("aria-label", toggle.getAttribute(isDark() ? "data-light" : "data-dark"));
  }

  updateLabel();
  toggle.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("oa-theme", next);
    } catch (e) {}
    updateLabel();
  });
})();
