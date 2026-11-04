// the form on /enter-data/; fold(), matches() and escapeHtml() come from site.js
(function () {
  var spec = JSON.parse(document.getElementById("enter-spec").textContent);
  var T = spec.text;
  var form = document.getElementById("enter-form");
  var kindSelect = document.getElementById("enter-kind");
  var fieldsBox = document.getElementById("enter-fields");
  var warning = document.getElementById("enter-warning");
  var listBox = document.getElementById("enter-entries");
  var status = document.getElementById("enter-status");
  var STORE = "oa-enter-entries";
  var index = [];
  var entries = [];
  var picked = {};
  var uid = 0;

  try {
    entries = JSON.parse(localStorage.getItem(STORE)) || [];
  } catch (e) {}
  // placeholder ids carry on from the saved list, so none repeats after a reload
  var seq = entries.reduce(function (max, e) { return Math.max(max, Number(e.record.id.split("-").pop()) || 0); }, 0);

  fetch(document.querySelector("[data-index]").getAttribute("data-index"))
    .then(function (r) { return r.json(); })
    .then(function (data) { index = data; });

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(entries));
    } catch (e) {}
  }

  // records in the archive, then ones waiting in the list below
  function candidates(kind) {
    var waiting = entries.filter(function (e) { return e.kind === kind; }).map(function (e) {
      return { id: e.record.id, kind: kind, title: e.record.name ? e.record.name.en : e.record.id, alt: [], fresh: true };
    });
    return index.filter(function (item) { return item.kind === kind; }).concat(waiting);
  }

  function find(kind, q) {
    var folded = fold(q);
    return candidates(kind)
      .filter(function (item) { return item.id === q.trim() || matches(q, item); })
      .sort(function (a, b) { return (fold(b.title).indexOf(folded) === 0) - (fold(a.title).indexOf(folded) === 0); })
      .slice(0, 8);
  }

  function titleOf(id) {
    var hit = index.concat(entries.map(function (e) { return { id: e.record.id, title: e.record.name ? e.record.name.en : e.record.id }; }))
      .filter(function (item) { return item.id === id; })[0];
    return hit ? hit.title : id;
  }

  // a search box that picks one record, or several when many is true
  function picker(id, kind, many, onChange) {
    var chosen = [];
    var wrap = document.createElement("div");
    wrap.className = "picker";
    wrap.innerHTML = '<ul class="picker__chosen"></ul><input type="search" id="' + id + '" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '-list" autocomplete="off" placeholder="' + escapeHtml(T.search) + '"><ul class="picker__list" id="' + id + '-list" role="listbox" hidden></ul>';
    var input = wrap.querySelector("input");
    var list = wrap.querySelector(".picker__list");
    var chips = wrap.querySelector(".picker__chosen");
    var active = -1;

    function draw() {
      chips.innerHTML = chosen.map(function (c, i) {
        return '<li><span>' + escapeHtml(titleOf(c)) + '</span> <button type="button" data-i="' + i + '" aria-label="' + escapeHtml(T.remove + " " + titleOf(c)) + '">×</button></li>';
      }).join("");
      input.hidden = !many && chosen.length > 0;
      onChange(many ? chosen.slice() : chosen[0]);
    }

    function close() {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      active = -1;
    }

    function choose(value) {
      if (chosen.indexOf(value) === -1) chosen.push(value);
      input.value = "";
      close();
      draw();
      if (!input.hidden) input.focus();
    }

    function mark() {
      Array.prototype.forEach.call(list.children, function (li, i) { li.setAttribute("aria-selected", i === active ? "true" : "false"); });
      if (list.children[active]) input.setAttribute("aria-activedescendant", list.children[active].id);
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (!q) return close();
      var hits = find(kind, q);
      list.innerHTML = hits.length
        ? hits.map(function (h, i) {
            return '<li role="option" id="' + id + "-o" + i + '" data-id="' + escapeHtml(h.id) + '" aria-selected="false">' + escapeHtml(h.title) + (h.fresh ? ' <span class="kind-tag">' + escapeHtml(T.new) + "</span>" : "") + "</li>";
          }).join("")
        : '<li class="picker__none">' + escapeHtml(T.none) + "</li>";
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      active = -1;
    });
    input.addEventListener("keydown", function (e) {
      var options = list.querySelectorAll("[role=option]");
      if (e.key === "ArrowDown" && options.length) { active = (active + 1) % options.length; mark(); e.preventDefault(); }
      else if (e.key === "ArrowUp" && options.length) { active = (active - 1 + options.length) % options.length; mark(); e.preventDefault(); }
      else if (e.key === "Enter" && active >= 0) { choose(options[active].getAttribute("data-id")); e.preventDefault(); }
      else if (e.key === "Escape") close();
    });
    list.addEventListener("mousedown", function (e) {
      var li = e.target.closest("[role=option]");
      if (li) { e.preventDefault(); choose(li.getAttribute("data-id")); }
    });
    input.addEventListener("blur", close);
    chips.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      chosen.splice(Number(b.getAttribute("data-i")), 1);
      draw();
      input.focus();
    });
    wrap.set = function (values) {
      chosen = [].concat(values || []);
      draw();
    };
    return wrap;
  }

  function field(f) {
    var id = "f-" + f.path.replace(/\W/g, "-");
    var box = document.createElement("div");
    box.className = "enter__field";
    var star = f.required ? ' <span class="enter__required">*</span>' : "";
    var hint = { stanzas: T.stanza_hint, list: T.list_hint, ints: T.ints_hint }[f.type];
    var hintId = hint ? ' aria-describedby="' + id + '-hint"' : "";
    var hintHtml = hint ? '<p class="enter__hint" id="' + id + '-hint">' + escapeHtml(hint) + "</p>" : "";
    var lang = f.lang ? ' lang="' + f.lang + '"' : "";
    var req = f.required ? " required" : "";
    var label = '<label class="enter__label" for="' + id + '">' + escapeHtml(f.label) + star + "</label>";

    if (f.type === "text" || f.type === "int" || f.type === "ints") {
      box.innerHTML = label + hintHtml + '<input type="text" id="' + id + '"' + (f.type === "int" ? ' inputmode="numeric"' : "") + lang + req + hintId + ">";
    } else if (f.type === "textarea" || f.type === "list" || f.type === "stanzas") {
      box.innerHTML = label + hintHtml + '<textarea id="' + id + '" rows="' + (f.type === "stanzas" ? 10 : 3) + '"' + lang + req + hintId + "></textarea>";
    } else if (f.type === "select") {
      box.innerHTML = label + '<select id="' + id + '"' + req + '><option value=""></option>' + f.options.map(function (o) { return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + "</option>"; }).join("") + "</select>";
    } else if (f.type === "checks") {
      box.innerHTML = '<fieldset><legend class="enter__label">' + escapeHtml(f.label) + star + "</legend>" + f.options.map(function (o) {
        return '<label class="enter__check"><input type="checkbox" name="' + id + '" value="' + escapeHtml(o.value) + '"> ' + escapeHtml(o.label) + "</label>";
      }).join("") + "</fieldset>";
    } else if (f.type === "link" || f.type === "links") {
      box.innerHTML = label;
      box.appendChild(picker(id, f.kind, f.type === "links", function (v) { picked[f.path] = v; }));
    } else if (f.type === "sources") {
      box.innerHTML = '<fieldset><legend class="enter__label">' + escapeHtml(f.label) + "</legend>" +
        '<label class="enter__label" for="' + id + '">' + escapeHtml(T.source) + "</label></fieldset>";
      var set = box.querySelector("fieldset");
      set.appendChild(picker(id, "source", false, function (v) { picked.sources = v; }));
      set.insertAdjacentHTML("beforeend", '<label class="enter__label" for="' + id + '-url">' + escapeHtml(T.source_url) + '</label><input type="url" id="' + id + '-url"><label class="enter__label" for="' + id + '-pages">' + escapeHtml(T.source_pages) + '</label><input type="text" id="' + id + '-pages">');
    } else if (f.type === "credits") {
      box.innerHTML = '<fieldset><legend class="enter__label">' + escapeHtml(f.label) + star + '</legend><ol class="enter__credits"></ol><button type="button" class="enter__button enter__button--quiet">' + escapeHtml(T.add) + "</button></fieldset>";
      var rows = box.querySelector("ol");
      picked.credits = [];
      box.querySelector("button").addEventListener("click", function () { addCredit(rows, f.options); });
      addCredit(rows, f.options);
    }
    return box;
  }

  function addCredit(rows, roles) {
    var n = ++uid;
    var row = { person: null };
    picked.credits.push(row);
    var li = document.createElement("li");
    li.innerHTML = '<label class="enter__label" for="c' + n + '">' + escapeHtml(spec.kinds.person || "Person") + "</label>";
    li.appendChild(picker("c" + n, "person", false, function (v) { row.person = v; }));
    li.insertAdjacentHTML("beforeend", '<label class="enter__label" for="c' + n + '-role">' + escapeHtml(T.role) + '</label><select id="c' + n + '-role">' + roles.map(function (o) { return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + "</option>"; }).join("") + '</select><label class="enter__label" for="c' + n + '-ins">' + escapeHtml(T.instrument) + '</label><input type="text" id="c' + n + '-ins">');
    li.querySelector("select").addEventListener("change", function (e) { row.role = e.target.value; });
    li.querySelector("#c" + n + "-ins").addEventListener("input", function (e) { row.instrument = e.target.value.trim(); });
    row.role = roles[0].value;
    rows.appendChild(li);
  }

  function draw() {
    picked = {};
    fieldsBox.innerHTML = "";
    warning.textContent = "";
    spec.forms[kindSelect.value].forEach(function (f) { fieldsBox.appendChild(field(f)); });
    var name = document.getElementById("f-name-en");
    if (name) name.addEventListener("change", function () { checkName(kindSelect.value, name.value); });
  }

  function existing(kind, name) {
    var folded = fold(name);
    return candidates(kind).filter(function (item) {
      return [item.title].concat(item.alt || []).some(function (n) { return fold(n) === folded; });
    });
  }

  function checkName(kind, name) {
    var same = name.trim() ? existing(kind, name) : [];
    warning.innerHTML = same.length ? escapeHtml(T.exists) + " " + same.map(function (s) { return s.url ? '<a href="' + escapeHtml(s.url) + '">' + escapeHtml(s.title) + "</a>" : escapeHtml(s.title); }).join(", ") : "";
  }

  function setPath(obj, path, value) {
    var keys = path.split(".");
    var last = keys.pop();
    keys.forEach(function (k) { obj = obj[k] = obj[k] || {}; });
    obj[last] = value;
  }

  function stanzas(text) {
    return text.split(/\n\s*\n/).map(function (block, i) {
      return { n: i, lines: block.split("\n").map(function (l) { return l.trim(); }).filter(Boolean) };
    }).filter(function (s) { return s.lines.length; });
  }

  function ints(text) {
    return text.split(/[,;\s]+/).filter(Boolean).map(Number);
  }

  // turns one value from the form or a CSV cell into what the record holds
  function convert(f, raw) {
    if (raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && !raw.length)) return undefined;
    if (f.type === "int") return Number(raw);
    if (f.type === "ints") return ints(raw);
    if (f.type === "list") return raw.split(/\n|;/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (f.type === "stanzas") return stanzas(raw);
    if (f.path === "held_on") return raw.map(function (c) { return { carrier: c }; });
    return raw;
  }

  function build(kind, read) {
    var record = { id: "new-" + kind + "-" + ++seq };
    var missing = [];
    spec.forms[kind].forEach(function (f) {
      var value = read(f);
      if (f.type === "sources") value = value && value.source ? [value] : undefined;
      if (f.type === "credits") {
        value = (value || []).filter(function (c) { return c.person; }).map(function (c) {
          return c.instrument ? { person: c.person, role: c.role, instrument: c.instrument } : { person: c.person, role: c.role };
        });
      }
      value = convert(f, value);
      if (f.path === "text.stanzas" && value) return setPath(record, "text", { stanzas: value });
      if (value === undefined || (Array.isArray(value) && !value.length)) {
        if (f.required) missing.push(f.label);
        return;
      }
      if (f.type === "ints" && value.some(isNaN)) missing.push(f.label);
      setPath(record, f.path, value);
    });
    return { record: record, missing: missing };
  }

  function readForm(f) {
    var el = document.getElementById("f-" + f.path.replace(/\W/g, "-"));
    if (f.type === "link" || f.type === "links") return picked[f.path];
    if (f.type === "checks") return Array.prototype.map.call(document.querySelectorAll('[name="f-' + f.path + '"]:checked'), function (c) { return c.value; });
    if (f.type === "credits") return picked.credits;
    if (f.type === "sources") {
      var url = document.getElementById("f-sources-url").value.trim();
      var pages = document.getElementById("f-sources-pages").value.trim();
      return picked.sources ? Object.assign({ source: picked.sources }, url ? { url: url } : {}, pages ? { pages: pages } : {}) : undefined;
    }
    return el.value.trim();
  }

  function renderList() {
    listBox.innerHTML = entries.length
      ? entries.map(function (e, i) {
          return '<li><span class="kind-tag">' + escapeHtml(spec.kinds[e.kind]) + "</span> " + escapeHtml(e.record.name ? e.record.name.en : titleOf(e.record.gita)) +
            ' <button type="button" class="enter__button enter__button--quiet" data-i="' + i + '">' + escapeHtml(T.remove) + "</button></li>";
        }).join("")
      : "<li>" + escapeHtml(T.empty) + "</li>";
    document.getElementById("enter-send").disabled = !entries.length;
    document.getElementById("enter-clear").disabled = !entries.length;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var kind = kindSelect.value;
    var made = build(kind, readForm);
    if (made.missing.length) {
      warning.textContent = T.missing + " " + made.missing.join(", ");
      return;
    }
    entries.push({ kind: kind, record: made.record });
    save();
    renderList();
    draw();
    status.textContent = T.added;
    document.getElementById("enter-list").scrollIntoView({ block: "start" });
  });

  listBox.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    entries.splice(Number(b.getAttribute("data-i")), 1);
    save();
    renderList();
  });

  kindSelect.addEventListener("change", draw);

  // CSV: one column per field, named by its path such as name.en; links take names or ids
  function columns(kind) {
    return spec.forms[kind].reduce(function (cols, f) {
      if (f.type === "sources") return cols.concat(["sources.source", "sources.url", "sources.pages"]);
      if (f.type === "credits") return cols.concat(["credits"]);
      return cols.concat([f.path]);
    }, []);
  }

  document.getElementById("enter-template").addEventListener("click", function () {
    var kind = kindSelect.value;
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([columns(kind).join(",") + "\n"], { type: "text/csv" }));
    a.download = kind + ".csv";
    a.click();
  });

  function parseCsv(text) {
    var rows = [[]];
    var cell = "";
    var quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') quoted = false;
        else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { rows[rows.length - 1].push(cell); cell = ""; }
      else if (c === "\n") { rows[rows.length - 1].push(cell.replace(/\r$/, "")); rows.push([]); cell = ""; }
      else cell += c;
    }
    rows[rows.length - 1].push(cell);
    return rows.filter(function (r) { return r.some(function (v) { return v.trim(); }); });
  }

  // a name matches when exactly one record of that kind has it
  function resolve(kind, value, unmatched) {
    var v = value.trim();
    if (!v) return undefined;
    if (candidates(kind).some(function (item) { return item.id === v; })) return v;
    var hits = existing(kind, v);
    if (hits.length === 1) return hits[0].id;
    var key = kind + "|" + v;
    unmatched[key] = unmatched[key] || { kind: kind, value: v, id: null };
    return key;
  }

  document.getElementById("enter-csv").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var kind = kindSelect.value;
    file.text().then(function (text) {
      var rows = parseCsv(text);
      var head = rows.shift().map(function (h) { return h.trim(); });
      var unmatched = {};
      var made = rows.map(function (row) {
        var cells = {};
        head.forEach(function (h, i) { cells[h] = (row[i] || "").trim(); });
        return build(kind, function (f) {
          if (f.type === "link") return resolve(f.kind, cells[f.path] || "", unmatched);
          if (f.type === "links") return (cells[f.path] || "").split(";").map(function (v) { return resolve(f.kind, v, unmatched); }).filter(Boolean);
          if (f.type === "checks") return (cells[f.path] || "").split(";").map(function (s) { return s.trim(); }).filter(Boolean);
          if (f.type === "credits") {
            return (cells.credits || "").split(";").filter(function (s) { return s.trim(); }).map(function (s) {
              var m = s.match(/^\s*(.+?)\s*\(([^,)]+)(?:,\s*([^)]+))?\)\s*$/) || [null, s, "vocalist"];
              var c = { person: resolve("person", m[1], unmatched), role: m[2].trim() };
              if (m[3]) c.instrument = m[3].trim();
              return c;
            });
          }
          if (f.type === "sources") {
            var src = resolve("source", cells["sources.source"] || "", unmatched);
            return src ? Object.assign({ source: src }, cells["sources.url"] ? { url: cells["sources.url"] } : {}, cells["sources.pages"] ? { pages: cells["sources.pages"] } : {}) : undefined;
          }
          return cells[f.path];
        });
      });
      var bad = made.filter(function (m) { return m.missing.length; });
      if (bad.length) {
        status.textContent = T.missing + " " + bad.map(function (m) { return (m.record.name ? m.record.name.en : m.record.id) + " (" + m.missing.join(", ") + ")"; }).join("; ");
        return;
      }
      askUnmatched(unmatched, function () {
        made.forEach(function (m) { entries.push({ kind: kind, record: swapKeys(m.record, unmatched) }); });
        save();
        renderList();
        status.textContent = T.rows.replace("{n}", made.length);
      });
    });
    e.target.value = "";
  });

  function swapKeys(value, unmatched) {
    if (typeof value === "string") return unmatched[value] ? unmatched[value].id : value;
    if (Array.isArray(value)) return value.map(function (v) { return swapKeys(v, unmatched); });
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = swapKeys(value[k], unmatched); });
      return out;
    }
    return value;
  }

  // names in the CSV that match no record, or more than one, are picked by hand
  function askUnmatched(unmatched, done) {
    var box = document.getElementById("enter-unmatched");
    var keys = Object.keys(unmatched);
    if (!keys.length) return done();
    box.innerHTML = "<h3>" + escapeHtml(T.unmatched) + "</h3>";
    var ol = document.createElement("ol");
    keys.forEach(function (key, i) {
      var u = unmatched[key];
      var li = document.createElement("li");
      li.innerHTML = '<label class="enter__label" for="u' + i + '">' + escapeHtml(u.value) + ' <span class="kind-tag">' + escapeHtml(spec.kinds[u.kind] || u.kind) + "</span></label>";
      li.appendChild(picker("u" + i, u.kind, false, function (v) { u.id = v || null; }));
      ol.appendChild(li);
    });
    box.appendChild(ol);
    var go = document.createElement("button");
    go.type = "button";
    go.className = "enter__button";
    go.textContent = T.add;
    go.addEventListener("click", function () {
      var left = keys.filter(function (k) { return !unmatched[k].id; });
      if (left.length) {
        status.textContent = T.missing + " " + left.map(function (k) { return unmatched[k].value; }).join(", ");
        return;
      }
      box.innerHTML = "";
      done();
    });
    box.appendChild(go);
  }

  // short lists go in the issue link; long ones are copied, or saved as a file to attach
  document.getElementById("enter-send").addEventListener("click", function () {
    var json = JSON.stringify({ records: entries }, null, 1);
    var first = entries[0].record.name ? entries[0].record.name.en : titleOf(entries[0].record.gita);
    var title = "New records: " + first + (entries.length > 1 ? " and " + (entries.length - 1) + " more" : "");
    var body = "Sent from the enter data page.\n\n```json\n" + json + "\n```\n";
    var url = spec.repo + "/issues/new?labels=new-records&title=" + encodeURIComponent(title);
    if ((url + "&body=" + encodeURIComponent(body)).length < 7500) {
      window.open(url + "&body=" + encodeURIComponent(body), "_blank", "noopener");
      status.textContent = T.sent;
    } else if (body.length < 60000) {
      navigator.clipboard.writeText(body).then(function () {
        window.open(url, "_blank", "noopener");
        status.textContent = T.pasted;
      });
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "text/plain" }));
      a.download = "entries.txt";
      a.click();
      window.open(url, "_blank", "noopener");
      status.textContent = T.attach;
    }
  });

  document.getElementById("enter-clear").addEventListener("click", function () {
    entries = [];
    save();
    renderList();
    status.textContent = "";
  });

  draw();
  renderList();
})();
