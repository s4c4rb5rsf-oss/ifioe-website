/* ifioe – kleine Interaktionen, ohne Bibliotheken */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  function onVisible(el, cb, threshold, keep) {
    if (!hasIO) { cb(true); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (keep) { cb(e.isIntersecting); return; }
        if (e.isIntersecting) { cb(true); io.disconnect(); }
      });
    }, { threshold: threshold || 0 });
    io.observe(el);
  }

  /* Kopfzeile: Hintergrund beim Scrollen, Mobil-Menü */
  var head = document.querySelector(".site-head");
  if (head) {
    var onScroll = function () { head.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    var btn = head.querySelector(".menu-btn");
    if (btn) {
      var setOpen = function (open) {
        head.classList.toggle("menu-open", open);
        document.body.classList.toggle("no-scroll", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
        btn.querySelector(".i-open").style.display = open ? "none" : "";
        btn.querySelector(".i-close").style.display = open ? "" : "none";
      };
      btn.addEventListener("click", function () { setOpen(!head.classList.contains("menu-open")); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
      window.addEventListener("resize", function () { if (window.innerWidth >= 760) setOpen(false); });
    }
  }

  /* Logo „Schwung“: Kugel schwingt zweimal und kommt zur Ruhe */
  document.querySelectorAll("[data-logo-anim]").forEach(function (svg) {
    var ball = svg.querySelector(".ball");
    if (!ball || reduce) return;
    var sp = 1.4, T = 2 * (2 * Math.PI / sp), start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / 1000, T);
      var w = Math.sin(t * sp) * (1 - Math.pow(t / T, 3));
      var a = w * 60 * Math.PI / 180;
      ball.setAttribute("cx", (50 + 34 * Math.sin(a)).toFixed(2));
      ball.setAttribute("cy", (40 + 34 * Math.cos(a) - 17).toFixed(2));
      if (t < T) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  /* Hero-Titel setzt sich zusammen */
  document.querySelectorAll(".assemble").forEach(function (el) {
    setTimeout(function () { el.classList.add("is-on"); }, reduce ? 0 : 120);
  });

  /* Einflug-Elemente */
  /* beobachtet wird der Rahmen (nicht das verschobene Element selbst) */
  document.querySelectorAll(".fly").forEach(function (el) {
    var root = el.closest("figure, section") || el.parentElement;
    onVisible(root, function () { el.classList.add("is-on"); }, 0.3);
  });

  /* Schreibmaschine */
  document.querySelectorAll("[data-typewriter]").forEach(function (el) {
    var text = el.getAttribute("data-typewriter");
    var live = el.querySelector(".tw__text");
    if (reduce) { live.textContent = text; return; }
    live.textContent = "";
    onVisible(el, function () {
      var i = 0;
      var id = setInterval(function () {
        i++; live.textContent = text.slice(0, i);
        if (i >= text.length) clearInterval(id);
      }, 1000 / 12);
    }, 0);
  });

  /* Pol-Linien: nur animieren, wenn sichtbar */
  document.querySelectorAll(".track").forEach(function (el) {
    onVisible(el, function (v) { el.classList.toggle("is-visible", v); }, 0.2, true);
  });

  /* Farbverlauf folgt der Maus (nur mit Maus) */
  if (!reduce && window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".mix").forEach(function (el) {
      var c = el.querySelector(".mix__cursor");
      if (!c) return;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        c.style.left = ((e.clientX - r.left) / r.width * 100) + "%";
        c.style.top = ((e.clientY - r.top) / r.height * 100) + "%";
        el.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", function () { el.classList.remove("is-hover"); });
    });
  }

  /* Isometrische Icons */
  var PRESETS = {
    vortrag: [{s:"square",c:"navy",x:0,y:0,w:2,h:.9},{s:"circle",c:"lime",x:.5,y:.5,w:1,h:.25,z:.9},{s:"circle",c:"pink",x:.75,y:.75,w:.5,h:.9,z:1.15}],
    workshop: [{s:"square",c:"peach",x:0,y:0,w:1,h:.6},{s:"square",c:"pink",x:1.2,y:0,w:1,h:1.1},{s:"square",c:"lime",x:0,y:1.2,w:1,h:.9},{s:"circle",c:"navy",x:1.2,y:1.2,w:1,h:.5}],
    fuehrung: [{s:"square",c:"peach",x:0,y:2,w:1,h:.5},{s:"square",c:"pink",x:0,y:1,w:1,h:1},{s:"square",c:"navy",x:0,y:0,w:1,h:1.5},{s:"circle",c:"lime",x:.2,y:.2,w:.6,h:.3,z:1.5}],
    prozess: [{s:"circle",c:"lime",x:0,y:0,w:1,h:.35},{s:"circle",c:"pink",x:1.25,y:0,w:1,h:.7},{s:"circle",c:"peach",x:2.5,y:0,w:1,h:1.05}],
    idee: [{s:"square",c:"slate",x:0,y:0,w:2,h:.3},{s:"quarter",c:"lime",x:.25,y:.25,w:1.5,h:1.2,z:.3}]
  };
  var K = .5774, SQ = Math.SQRT1_2, ZK = .8165, U = 40;
  var FROM = [[-90,-120],[110,-90],[-110,90],[90,120],[0,-150]];
  function rad(s, u) { return s === "circle" ? "50%" : s === "quarter" ? "100% 0 0 0" : s === "leaf" ? "0 100% 0 100%" : s === "pill" ? (u / 2) + "px" : Math.max(3, u * .12) + "px"; }
  function P(gx, gy, z) { return [(gx - gy) * U * SQ, (gx + gy) * U * SQ * K - z * U * ZK]; }

  document.querySelectorAll("[data-iso]").forEach(function (host) {
    var B = PRESETS[host.getAttribute("data-iso")] || PRESETS.workshop;
    var size = Number(host.getAttribute("data-size")) || 150;
    var frameColor = host.getAttribute("data-frame");
    var run = !reduce;
    host.classList.add("iso");
    host.style.width = size + "px"; host.style.height = size + "px";
    host.setAttribute("aria-hidden", "true");

    var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    B.forEach(function (b) {
      var d = b.d || b.w, z = b.z || 0;
      [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + d], [b.x + b.w, b.y + d]].forEach(function (p) {
        [z, z + b.h].forEach(function (zz) {
          var s = P(p[0], p[1], zz);
          mnx = Math.min(mnx, s[0]); mxx = Math.max(mxx, s[0]); mny = Math.min(mny, s[1]); mxy = Math.max(mxy, s[1]);
        });
      });
    });
    var W = mxx - mnx, H = mxy - mny, sc = size * (frameColor ? .62 : .92) / Math.max(W, H);

    if (frameColor) {
      var fr = document.createElement("div"); fr.className = "iso__frame"; fr.style.borderColor = frameColor; host.appendChild(fr);
    }
    var stage = document.createElement("div");
    stage.className = "iso__stage";
    stage.style.width = W + "px"; stage.style.height = H + "px"; stage.style.transform = "scale(" + sc + ")";
    host.appendChild(stage);

    var sorted = B.slice().sort(function (a, b) { return (a.x + a.y + (a.z || 0) * .01) - (b.x + b.y + (b.z || 0) * .01); });
    var groups = [];
    sorted.forEach(function (b, bi) {
      var d = b.d || b.w, z = b.z || 0, col = b.c || "navy", pw = b.w * U, ph = d * U;
      var n = Math.max(2, Math.round(b.h * U * ZK));
      var g = document.createElement("div"); g.className = "iso__group";
      var html = "";
      for (var i = 0; i <= n; i++) {
        var top = i === n, c = P(b.x + b.w / 2, b.y + d / 2, z + b.h * (i / n));
        var base = "left:" + (c[0] - mnx - pw / 2) + "px;top:" + (c[1] - mny - ph / 2) + "px;width:" + pw + "px;height:" + ph + "px;border-radius:" + rad(b.s, Math.min(pw, ph)) + ";transform:scaleY(" + K + ") rotate(45deg);";
        var bg = top ? "var(--" + col + "-500)" : "linear-gradient(135deg, color-mix(in oklab, var(--" + col + "-500) 78%, var(--navy-900)) 50%, color-mix(in oklab, var(--" + col + "-500) 56%, var(--navy-900)) 50%)";
        html += '<div class="iso__layer" style="' + base + "background:" + bg + '"></div>';
        if (top) html += '<div class="iso__layer" style="' + base + "box-shadow:inset 0 0 0 1.5px var(--" + col + '-300);opacity:.7"></div>';
      }
      g.innerHTML = html;
      if (run) {
        var f = FROM[bi % FROM.length];
        g.style.transform = "translate(" + f[0] + "px," + f[1] + "px) rotate(" + (bi % 2 ? 14 : -14) + "deg)";
        g.style.opacity = "0";
        g.style.transition = "transform 1.3s cubic-bezier(.22,1.2,.36,1) " + (bi * .16) + "s, opacity .6s ease " + (bi * .16) + "s";
      }
      stage.appendChild(g); groups.push(g);
    });
    if (run) {
      onVisible(host, function () {
        groups.forEach(function (g) { g.style.transform = "translate(0,0) rotate(0deg)"; g.style.opacity = "1"; });
      }, 0.35);
    }
  });
})();
