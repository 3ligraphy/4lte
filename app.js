(function () {
  "use strict";

  var STORAGE_KEY = "invoice-builder-v1";
  var DEFAULT_LOGO = "logo.svg";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var body = $("#itemsBody");
  var rowTpl = $("#rowTpl");
  var logoImg = $("#logoImg");
  var accentInput = $("#accentInput");

  var state = load() || defaults();

  function defaults() {
    var today = new Date();
    var due = new Date(today.getTime() + 14 * 864e5);
    return {
      fields: { issueDate: isoDate(today), dueDate: isoDate(due) },
      items: [
        { desc: "Design services", qty: 10, price: 50 },
        { desc: "Development", qty: 20, price: 75 }
      ],
      logo: null,
      accent: "#1e3a8a"
    };
  }

  function isoDate(d) { return d.toISOString().slice(0, 10); }

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  function money(n) {
    return (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  function autosize(el) {
    if (el.tagName !== "TEXTAREA") return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 2 + "px";
  }

  /* ---------- Fields ---------- */
  function initFields() {
    $$("[data-field]").forEach(function (el) {
      var key = el.dataset.field;
      if (state.fields[key] !== undefined) el.value = state.fields[key];
      else state.fields[key] = el.value;
      autosize(el);
      el.addEventListener("input", function () {
        state.fields[key] = el.value;
        autosize(el);
        if (key === "tax" || key === "discount") recalc();
        save();
      });
    });
  }

  /* ---------- Items ---------- */
  function renderItems() {
    body.innerHTML = "";
    state.items.forEach(function (item, i) {
      var row = rowTpl.content.firstElementChild.cloneNode(true);
      $(".c-no", row).textContent = i + 1;
      $$("[data-k]", row).forEach(function (el) {
        var k = el.dataset.k;
        el.value = item[k] === undefined ? "" : item[k];
        el.addEventListener("input", function () {
          item[k] = k === "desc" ? el.value : el.value === "" ? "" : num(el.value);
          autosize(el);
          recalc();
          save();
        });
      });
      $(".del", row).addEventListener("click", function () {
        state.items.splice(i, 1);
        renderItems();
        save();
      });
      body.appendChild(row);
      autosize($("textarea", row));
    });
    recalc();
  }

  function recalc() {
    var subtotal = 0;
    $$("tr", body).forEach(function (row, i) {
      var it = state.items[i];
      var amount = num(it.qty) * num(it.price);
      subtotal += amount;
      $(".c-amount", row).textContent = money(amount);
    });
    var discount = subtotal * num(state.fields.discount) / 100;
    var tax = (subtotal - discount) * num(state.fields.tax) / 100;
    $("#subtotal").textContent = money(subtotal);
    $("#discountAmt").textContent = discount ? "−" + money(discount) : money(0);
    $("#taxAmt").textContent = money(tax);
    $("#grandTotal").textContent = money(subtotal - discount + tax);
  }

  /* ---------- Logo ---------- */
  function applyLogo() { logoImg.src = state.logo || DEFAULT_LOGO; }

  $("#logoInput").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { state.logo = reader.result; applyLogo(); save(); };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  $("#resetLogo").addEventListener("click", function () { state.logo = null; applyLogo(); save(); });

  /* ---------- Accent colour ---------- */
  function applyAccent() {
    var c = state.accent || "#1e3a8a";
    document.documentElement.style.setProperty("--accent", c);
    document.documentElement.style.setProperty("--accent-soft", mix(c, "#ffffff", 0.9));
    accentInput.value = c;
  }

  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var ch = function (p, s) { return (p >> s) & 255; };
    var out = [16, 8, 0].map(function (s) {
      return Math.round(ch(pa, s) * (1 - t) + ch(pb, s) * t).toString(16).padStart(2, "0");
    });
    return "#" + out.join("");
  }

  accentInput.addEventListener("input", function () { state.accent = accentInput.value; applyAccent(); save(); });

  /* ---------- Toolbar ---------- */
  $("#addItem").addEventListener("click", function () {
    state.items.push({ desc: "", qty: 1, price: 0 });
    renderItems();
    save();
    var rows = $$("tr", body);
    $("textarea", rows[rows.length - 1]).focus();
  });

  $("#printBtn").addEventListener("click", function () { window.print(); });

  $("#newInvoice").addEventListener("click", function () {
    if (!confirm("Start a new invoice? Line items and client details will be cleared (your company info and logo are kept).")) return;
    var keep = ["companyName", "companyAddress", "paymentDetails", "notes", "footer", "currency", "tax"];
    var fresh = defaults();
    keep.forEach(function (k) { if (state.fields[k] !== undefined) fresh.fields[k] = state.fields[k]; });
    var prevNo = state.fields.invoiceNo || "INV-0000";
    fresh.fields.invoiceNo = prevNo.replace(/(\d+)(?!.*\d)/, function (d) {
      return String(parseInt(d, 10) + 1).padStart(d.length, "0");
    });
    fresh.items = [{ desc: "", qty: 1, price: 0 }];
    fresh.logo = state.logo;
    fresh.accent = state.accent;
    state = fresh;
    save();
    location.reload();
  });

  window.addEventListener("beforeprint", function () { $$("textarea").forEach(autosize); });

  initFields();
  renderItems();
  applyLogo();
  applyAccent();
})();
