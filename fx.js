/* DupFinder site effects — vanilla, zero dependencies.
   Every effect respects prefers-reduced-motion and degrades to static. */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── reveal on scroll (with safety net) ── */
  function revealAll() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { el.classList.add("in"); });
  }
  if (!("IntersectionObserver" in window) || reduced) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    setTimeout(revealAll, 1500);
  }

  /* ── ambient hex field: drifting hash characters behind the hero ── */
  var canvas = document.getElementById("hexfield");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d");
    var chars = "0123456789abcdef";
    var drops = [];
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    function sizeCanvas() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    sizeCanvas();
    for (var i = 0; i < 26; i++) {
      drops.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        s: 0.15 + Math.random() * 0.35,
        c: chars[(Math.random() * 16) | 0],
        f: 10 + Math.random() * 5,
        t: Math.random() * 1000
      });
    }
    var frame = 0;
    function drawHex() {
      frame++;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      ctx.fillStyle = dark ? "rgba(120,150,255,0.10)" : "rgba(46,127,248,0.09)";
      drops.forEach(function (d) {
        d.y += d.s;
        if (d.y > canvas.offsetHeight + 20) { d.y = -20; d.x = Math.random() * canvas.offsetWidth; }
        if (frame % 30 === 0 && Math.random() < 0.3) d.c = chars[(Math.random() * 16) | 0];
        ctx.font = d.f + "px ui-monospace, Menlo, monospace";
        ctx.fillText(d.c, d.x, d.y);
      });
      requestAnimationFrame(drawHex);
    }
    window.addEventListener("resize", sizeCanvas);
    drawHex();
  }

  /* ── the signature: duplicate pair merges, hash types out, verdict snaps ── */
  var pair = document.getElementById("pairproof");
  if (pair) {
    var hashEl = pair.querySelector(".pp-hash");
    var chipEl = pair.querySelector(".pp-chip");
    var HASH = "sha256 · 7a22113996bc41f0";
    function typeHash(i) {
      if (i <= HASH.length) {
        hashEl.textContent = HASH.slice(0, i) + (i < HASH.length ? "▍" : "");
        setTimeout(function () { typeHash(i + 1); }, 34);
      } else {
        chipEl.classList.add("on");
      }
    }
    if (reduced) {
      pair.classList.add("done");
      hashEl.textContent = HASH;
      chipEl.classList.add("on");
    } else {
      setTimeout(function () { pair.classList.add("merge"); }, 500);
      setTimeout(function () { typeHash(0); }, 1500);
    }
  }

  /* ── spotlight cards: cursor-tracked glow (21st.dev style) ── */
  if (!reduced && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".b-card, .stat").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
    document.body.classList.add("spot");
  }

  /* ── count-up stats when they reveal ── */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 900, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  var counted = false;
  var statsEl = document.querySelector(".stats");
  if (statsEl && !reduced && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !counted) {
          counted = true;
          statsEl.querySelectorAll("[data-count]").forEach(countUp);
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 }).observe(statsEl);
  }

  /* ── nav scroll progress ── */
  var prog = document.getElementById("navprog");
  if (prog) {
    addEventListener("scroll", function () {
      var h = document.documentElement;
      var p = h.scrollTop / (h.scrollHeight - h.clientHeight);
      prog.style.width = (p * 100) + "%";
    }, { passive: true });
  }

  /* ── the scan demo: beam sweeps, duplicates light up ── */
  var row = document.getElementById("scanrow");
  if (row) {
    var beam = document.getElementById("scanbeam");
    var verdict = document.getElementById("scanverdict");
    var count = document.getElementById("scancount");
    var foundEl = document.getElementById("scanfound");
    var phs = row.querySelectorAll(".scan-ph");
    var DUPS = [0, 4];
    function resetScan() {
      phs.forEach(function (p) { p.classList.remove("lit", "dup"); });
      verdict.classList.remove("on");
      foundEl.textContent = "";
      count.textContent = "scanning…";
    }
    function runScan() {
      if (reduced) {
        DUPS.forEach(function (i) { phs[i].classList.add("dup"); });
        verdict.classList.add("on");
        count.textContent = "3,412 photos";
        foundEl.textContent = "1.3 MB recoverable";
        return;
      }
      resetScan();
      var t0 = null, DUR = 2600;
      beam.style.opacity = "1";
      function sweep(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / DUR, 1);
        var w = row.offsetWidth;
        beam.style.transform = "translateX(" + (p * (w + 10)) + "px)";
        count.textContent = Math.round(3412 * p).toLocaleString() + " photos";
        var idx = Math.floor(p * phs.length);
        phs.forEach(function (ph, i) { ph.classList.toggle("lit", i === idx); });
        if (p < 1) requestAnimationFrame(sweep);
        else {
          beam.style.opacity = "0";
          phs.forEach(function (ph) { ph.classList.remove("lit"); });
          DUPS.forEach(function (i) { phs[i].classList.add("dup"); });
          verdict.classList.add("on");
          foundEl.textContent = "1.3 MB recoverable";
          setTimeout(runScan, 6000);
        }
      }
      requestAnimationFrame(sweep);
    }
    if ("IntersectionObserver" in window) {
      var started = false;
      new IntersectionObserver(function (es, obs) {
        es.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; setTimeout(runScan, 400); obs.disconnect(); }
        });
      }, { threshold: 0.4 }).observe(row);
    } else runScan();
  }

  /* ── scrollytelling: sticky phone swaps screens per step ── */
  var steps = document.querySelectorAll("#scrollysteps .step");
  var screen = document.getElementById("scrollyscreen");
  var dots = document.getElementById("scrollydots");
  if (steps.length && screen) {
    var imgs = screen.querySelectorAll("img");
    var dotEls = dots ? dots.querySelectorAll("span") : [];
    var current = 0;
    function setShot(i) {
      if (i === current) return;
      current = i;
      imgs.forEach(function (im, k) { im.classList.toggle("show", k === i); });
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      dotEls.forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }
    addEventListener("scroll", function () {
      var mid = innerHeight / 2;
      var best = 0, bestDist = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setShot(best);
    }, { passive: true });
  }

  /* ── gentle 3D tilt on the hero phone ── */
  var stage = document.querySelector(".phone-stage");
  var phone = document.querySelector(".phone");
  if (stage && phone && !reduced && matchMedia("(pointer: fine)").matches) {
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      phone.style.transform =
        "rotate(3deg) perspective(900px) rotateY(" + (dx * 7) + "deg) rotateX(" + (-dy * 5) + "deg)";
    });
    stage.addEventListener("pointerleave", function () {
      phone.style.transform = "";
    });
  }
})();
