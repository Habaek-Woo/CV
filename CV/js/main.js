(function () {
  "use strict";

  var THEME_KEY = "portfolio-theme";
  var doc = document.documentElement;

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* ignore */
    }
  }

  function applyTheme(theme) {
    if (theme === "light") {
      doc.setAttribute("data-theme", "light");
    } else {
      doc.removeAttribute("data-theme");
    }
    syncThemeUI();
  }

  function syncThemeUI() {
    var isLight = doc.getAttribute("data-theme") === "light";
    var toggles = document.querySelectorAll(".js-theme-toggle");
    toggles.forEach(function (btn) {
      btn.setAttribute("aria-pressed", isLight ? "true" : "false");
      btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    });
    document.querySelectorAll("[data-theme-label]").forEach(function (el) {
      var inNav = el.closest(".theme-toggle");
      el.textContent = inNav ? (isLight ? "Dark" : "Light") : isLight ? "Dark mode" : "Light mode";
    });
  }

  function initTheme() {
    var stored = getStoredTheme();
    var prefersLight =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    var initial = stored || (prefersLight ? "light" : "dark");
    applyTheme(initial);

    document.querySelectorAll(".js-theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isLight = doc.getAttribute("data-theme") === "light";
        var next = isLight ? "dark" : "light";
        applyTheme(next);
        setStoredTheme(next);
      });
    });
  }

  function initNav() {
    var nav = document.querySelector(".nav");
    var btn = document.querySelector(".nav__toggle");
    var menu = document.getElementById("nav-menu");
    if (!nav || !btn || !menu) return;

    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", "Open menu");
      });
    });
  }

  function initReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length || !("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function initHeaderShadow() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    function applyScrollState() {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(applyScrollState);
      }
    }

    applyScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initSkillBars() {
    var fills = document.querySelectorAll(".skill-bars__fill");
    if (!fills.length || !("IntersectionObserver" in window)) {
      fills.forEach(function (fill) {
        fill.style.width = fill.style.getPropertyValue("--p") || fill.parentElement.getAttribute("aria-valuenow") + "%";
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var track = entry.target;
          var fill = track.querySelector(".skill-bars__fill");
          var p = fill && (fill.dataset.targetWidth || fill.style.getPropertyValue("--p").trim());
          if (fill && p) {
            requestAnimationFrame(function () {
              fill.style.width = p;
            });
          }
          io.unobserve(track);
        });
      },
      { threshold: 0.08, rootMargin: "80px 0px 80px 0px" }
    );

    document.querySelectorAll(".skill-bars__track").forEach(function (track) {
      var fill = track.querySelector(".skill-bars__fill");
      if (fill) {
        var target = fill.style.getPropertyValue("--p").trim() || "0%";
        fill.style.width = "0%";
        fill.dataset.targetWidth = target;
      }
      io.observe(track);
    });

    /* If IO never runs (layout edge cases on fast loads / some mobile browsers), restore bars after a short delay */
    window.setTimeout(function () {
      document.querySelectorAll(".skill-bars__fill").forEach(function (fill) {
        var w = fill.style.width;
        if (w !== "0%" && w !== "") return;
        var t = fill.dataset.targetWidth || fill.style.getPropertyValue("--p").trim();
        if (t) fill.style.width = t;
      });
    }, 2800);
  }

  function initFormSubmitNext() {
    var next = document.getElementById("form-submit-next");
    if (!next) return;
    try {
      var page = new URL(window.location.href);
      var resolved = new URL("thank-you.html", page.href);
      if (resolved.origin !== page.origin) {
        next.value = "";
        return;
      }
      next.value = resolved.href;
    } catch (err) {
      next.value = "";
    }
  }

  var FORMSUBMIT_HOST = "formsubmit.co";

  function isAllowedFormAction(action) {
    try {
      var u = new URL(action, window.location.href);
      return u.protocol === "https:" && u.hostname === FORMSUBMIT_HOST;
    } catch (e) {
      return false;
    }
  }

  function stripUnsafeControls(s, allowNewlines) {
    if (!s) return "";
    var out = String(s).replace(/\0/g, "");
    if (!allowNewlines) {
      out = out.replace(/[\r\n]+/g, " ");
    }
    return out.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  }

  function prefersTapImageSwap() {
    if (!window.matchMedia) return false;
    var noHover = window.matchMedia("(hover: none)").matches;
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    return noHover || coarse;
  }

  function setNetworkSwapA11y(el, tapMode) {
    var hoverL = el.getAttribute("data-label-hover") || "";
    var tapL = el.getAttribute("data-label-tap") || "";
    if (tapMode) {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", tapL);
      el.setAttribute("aria-pressed", el.classList.contains("is-touch-swap-alt") ? "true" : "false");
    } else {
      el.removeAttribute("role");
      el.removeAttribute("tabindex");
      el.removeAttribute("aria-pressed");
      if (hoverL) el.setAttribute("aria-label", hoverL);
      else el.removeAttribute("aria-label");
    }
  }

  function bindTapToggle(el, onToggle) {
    function go() {
      onToggle();
    }
    el.addEventListener("click", go);
    el.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      go();
    });
  }

  function initTapImageSwap() {
    var tap = prefersTapImageSwap();

    document.querySelectorAll(".js-network-swap").forEach(function (el) {
      if (tap) {
        setNetworkSwapA11y(el, true);
        var keyActivating = false;
        function toggleNetwork() {
          el.classList.toggle("is-touch-swap-alt");
          el.setAttribute("aria-pressed", el.classList.contains("is-touch-swap-alt") ? "true" : "false");
        }
        el.addEventListener("click", function () {
          if (keyActivating) return;
          toggleNetwork();
        });
        el.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          keyActivating = true;
          toggleNetwork();
          window.setTimeout(function () {
            keyActivating = false;
          }, 0);
        });
      } else {
        setNetworkSwapA11y(el, false);
      }
    });

    if (!tap) return;

    document.querySelectorAll(".profile-photo-swap").forEach(function (el) {
      bindTapToggle(el, function () {
        el.classList.toggle("is-touch-swap-alt");
      });
    });
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    initFormSubmitNext();
    var submitBtn = document.getElementById("contact-submit");
    form.addEventListener("submit", function (e) {
      if (!isAllowedFormAction(form.getAttribute("action") || "")) {
        e.preventDefault();
        return;
      }

      var gotcha = form.querySelector('input[name="_gotcha"]');
      if (gotcha && gotcha.value && gotcha.value.length > 0) {
        e.preventDefault();
        return;
      }

      var nextInput = form.querySelector("#form-submit-next");
      if (nextInput && nextInput.value) {
        try {
          var nextUrl = new URL(nextInput.value, window.location.href);
          if (nextUrl.origin !== new URL(window.location.href).origin) {
            e.preventDefault();
            return;
          }
        } catch (err2) {
          e.preventDefault();
          return;
        }
      }

      var nameEl = form.querySelector("#contact-name");
      var emailEl = form.querySelector("#contact-email");
      var msg = form.querySelector("#contact-message");
      if (nameEl) nameEl.value = stripUnsafeControls(nameEl.value, false);
      if (emailEl) emailEl.value = stripUnsafeControls(emailEl.value, false).replace(/\s+/g, "");
      if (msg) msg.value = stripUnsafeControls(msg.value, true);

      if (nameEl && nameEl.value.length < 2) {
        e.preventDefault();
        nameEl.focus();
        return;
      }
      if (emailEl && (!emailEl.value || emailEl.value.indexOf("@") < 1)) {
        e.preventDefault();
        emailEl.focus();
        return;
      }
      if (msg && (msg.value.length < 10 || msg.value.length > 5000)) {
        e.preventDefault();
        msg.focus();
        return;
      }

      /* Defer disabling the button so the browser still treats the click as a valid POST submitter (sync disable can cancel navigation). */
      if (submitBtn) {
        submitBtn.setAttribute("aria-busy", "true");
        window.setTimeout(function () {
          submitBtn.disabled = true;
        }, 0);
      }
    });
  }

  initTheme();
  initNav();
  initReveal();
  initHeaderShadow();
  initYear();
  initSkillBars();
  initTapImageSwap();
  initContactForm();
})();
