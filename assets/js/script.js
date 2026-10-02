/* ============================================================
   IEI STUDENT CHAPTER — GLOBAL JAVASCRIPT
   File: assets/js/script.js
   Purpose: Global UI interactions for the entire website.
   ============================================================ */

(() => {
  "use strict";

  /* --------------------------------------------------------
       0. Helpers
       -------------------------------------------------------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const loadIncludes = async () => {
    const placeholders = qsa("[data-include]");
    await Promise.all(
      placeholders.map(async (placeholder) => {
        const path = placeholder.getAttribute("data-include");
        try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          placeholder.innerHTML = await response.text();
          placeholder.removeAttribute("data-include");
        } catch (error) {
          console.error(`Unable to load include "${path}":`, error);
        }
      }),
    );
  };

  /* --------------------------------------------------------
       1. Header — shadow on scroll
       -------------------------------------------------------- */
  const initHeaderScroll = () => {
    const header = qs(".site-header");
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  /* --------------------------------------------------------
       2. Sidebar (off-canvas) — open / close / overlay / ESC
       -------------------------------------------------------- */
  const initSidebar = () => {
    const sidebar = qs("#ieiSidebar");
    const overlay = qs("#ieiSidebarOverlay");
    const openers = qsa("[data-sidebar-open]");
    const closers = qsa("[data-sidebar-close]");
    if (!sidebar) return;

    const open = () => {
      sidebar.classList.add("is-open");
      sidebar.setAttribute("aria-hidden", "false");
      overlay?.classList.add("is-visible");
      document.body.classList.add("sidebar-open");

      // Focus trap: focus first focusable element
      const firstFocusable = sidebar.querySelector("a, button");
      firstFocusable?.focus({ preventScroll: true });

      openers.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
    };

    const close = () => {
      sidebar.classList.remove("is-open");
      sidebar.setAttribute("aria-hidden", "true");
      overlay?.classList.remove("is-visible");
      document.body.classList.remove("sidebar-open");
      openers.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    };

    openers.forEach((btn) => btn.addEventListener("click", open));
    closers.forEach((btn) => btn.addEventListener("click", close));
    overlay?.addEventListener("click", close);

    // ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("is-open")) close();
    });

    // Auto-close on resize to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992 && sidebar.classList.contains("is-open"))
        close();
    });

    // Close when a nav link is clicked
    qsa("a", sidebar).forEach((a) =>
      a.addEventListener("click", () => {
        if (sidebar.classList.contains("is-open")) close();
      }),
    );
  };

  /* --------------------------------------------------------
       3. Active navigation detection (based on current URL)
       -------------------------------------------------------- */
  const initActiveNav = () => {
    const path = window.location.pathname.split("/").pop() || "index.html";
    qsa(".navbar-iei .nav-link, .sidebar-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const isMatch =
        href === path ||
        (path === "" && href === "index.html") ||
        (href !== "#" && path.startsWith(href.replace(".html", "")));
      if (isMatch) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  };

  /* --------------------------------------------------------
       4. Footer — current year
       -------------------------------------------------------- */
  const initFooterYear = () => {
    qsa("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  };

  /* --------------------------------------------------------
       5. Back to top button
       -------------------------------------------------------- */
  const initBackToTop = () => {
    const btn = qs("#backToTop");
    if (!btn) return;

    const toggle = () => {
      if (window.scrollY > 400) btn.classList.add("is-visible");
      else btn.classList.remove("is-visible");
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });

    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  };

  /* --------------------------------------------------------
       6. Scroll reveal (IntersectionObserver based, lightweight)
          Usage: add class "reveal" to any element.
       -------------------------------------------------------- */
  const initScrollReveal = () => {
    const items = qsa(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    items.forEach((el) => observer.observe(el));
  };

  /* --------------------------------------------------------
       7. Smooth in-page anchor scroll (respects reduced motion)
       -------------------------------------------------------- */
  const initSmoothAnchors = () => {
    qsa('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#" || id.length < 2) return;
        const target = qs(id);
        if (!target) return;

        e.preventDefault();
        const header = qs(".site-header");
        const offset = header ? header.offsetHeight + 8 : 0;
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      });
    });
  };

  /* --------------------------------------------------------
       8. Auto-dismiss alerts (opt-in via [data-auto-dismiss])
       -------------------------------------------------------- */
  const initAutoDismissAlerts = () => {
    qsa("[data-auto-dismiss]").forEach((alert) => {
      const delay =
        parseInt(alert.getAttribute("data-auto-dismiss"), 10) || 5000;
      setTimeout(() => {
        alert.style.transition = "opacity 300ms ease, transform 300ms ease";
        alert.style.opacity = "0";
        alert.style.transform = "translateY(-6px)";
        setTimeout(() => alert.remove(), 320);
      }, delay);
    });
  };

  /* --------------------------------------------------------
       9. External link hardening (frontend safety)
       -------------------------------------------------------- */
  const initExternalLinks = () => {
    qsa('a[href^="http"]').forEach((link) => {
      const sameHost = link.hostname === window.location.hostname;
      if (!sameHost) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  };

  /* --------------------------------------------------------
       10. Bootstrap-like tooltip/popover bridge (optional)
           Only activates if Bootstrap JS is present on the page.
       -------------------------------------------------------- */
  const initBootstrapComponents = () => {
    if (typeof window.bootstrap === "undefined") return;

    // Bootstrap tooltips (opt-in via [data-bs-toggle="tooltip"])
    qsa('[data-bs-toggle="tooltip"]').forEach((el) => {
      new window.bootstrap.Tooltip(el);
    });
  };

  /* --------------------------------------------------------
       11. Boot
       -------------------------------------------------------- */
  const init = () => {
    initHeaderScroll();
    initSidebar();
    initActiveNav();
    initFooterYear();
    initBackToTop();
    initScrollReveal();
    initSmoothAnchors();
    initAutoDismissAlerts();
    initExternalLinks();
    initBootstrapComponents();
  };

  const boot = async () => {
    await loadIncludes();
    init();
    document.dispatchEvent(new Event("site:includes-loaded"));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
/* ============================================================
   COMPONENT-SPECIFIC ADDITIONS
   Append these to the EXISTING assets/js/script.js.
   They complement the design-system IIFE — do not replace it.
   ============================================================ */

(() => {
  "use strict";

  /* --------------------------------------------------------
     A. Sidebar `inert` toggling
     When the sidebar is closed, its links should not be
     focusable/tabbable. Toggle the `inert` attribute in sync
     with the `.is-open` class.
     -------------------------------------------------------- */
  const initSidebarInert = () => {
    const sidebar = document.getElementById("ieiSidebar");
    if (!sidebar) return;

    const apply = () => {
      const isOpen = sidebar.classList.contains("is-open");
      if (isOpen) sidebar.removeAttribute("inert");
      else sidebar.setAttribute("inert", "");
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
  };

  /* --------------------------------------------------------
     B. Future-route placeholder handling
     Links marked with [data-future-route] are UI-only. Prevent
     navigation jumps to '#'.
     -------------------------------------------------------- */
  const initFutureRoutes = () => {
    const nodes = document.querySelectorAll("[data-future-route]");
    if (!nodes.length) return;

    nodes.forEach((el) => {
      el.addEventListener("click", (e) => {
        const href = el.getAttribute("href");
        if (!href || href === "#") {
          e.preventDefault();
          el.setAttribute("aria-disabled", "true");
          el.setAttribute("title", "Coming soon");
        }
      });
    });
  };

  /* --------------------------------------------------------
     C. Hamburger button aria-expanded mirror
     -------------------------------------------------------- */
  const initSidebarAriaSync = () => {
    const toggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("ieiSidebar");
    if (!toggle || !sidebar) return;

    const apply = () => {
      const isOpen = sidebar.classList.contains("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
  };

  /* --------------------------------------------------------
     D. Boot — must run AFTER includes are injected
     -------------------------------------------------------- */
  const init = () => {
    initSidebarInert();
    initFutureRoutes();
    initSidebarAriaSync();
  };

  document.addEventListener("site:includes-loaded", init, { once: true });
})();
