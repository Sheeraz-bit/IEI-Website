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
      let isMatch =
        href === path ||
        (path === "" && href === "index.html") ||
        (href !== "#" && path.startsWith(href.replace(".html", "")));
      if (!isMatch && path === "projectDetails.html" && href === "projects.html") {
        isMatch = true;
      }
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
/* ============================================================
   CONTACT US PAGE — Enquiry form behaviour
   Loaded on every page but only activates if #contactForm exists.
   ============================================================ */

(() => {
  "use strict";

  const getProjectOptions = () =>
    Array.isArray(window.IEI_PROJECTS)
      ? window.IEI_PROJECTS.map((project) => ({
          id: project.id,
          title: project.title
        }))
      : [];

  /* --------------------------------------------------------
     Enquiry types that require the project selector
     -------------------------------------------------------- */
  const TYPES_WITH_PROJECT = ["hire", "project"];

  /* --------------------------------------------------------
     Map enquiry value → block id shown
     -------------------------------------------------------- */
  const BLOCK_MAP = {
    hire:          "block-hire",
    project:       "block-project",
    student:       "block-student",
    collaboration: "block-collaboration",
    chapter:       "block-chapter",
    technical:     "block-technical",
    general:       "block-general",
    other:         "block-general"
  };

  /* --------------------------------------------------------
     Required fields per enquiry type (id → human label)
     -------------------------------------------------------- */
  const REQUIRED_FIELDS = {
    hire:          { interest: "Interest", requirement: "Requirement" },
    project:       { question: "Your Question" },
    student:       { studentMessage: "Your Enquiry" },
    collaboration: { collaborationMessage: "Your Idea" },
    chapter:       { chapterMessage: "Your Question" },
    technical:     { technicalMessage: "Your Requirement" },
    general:       { subject: "Subject", message: "Message" },
    other:         { subject: "Subject", message: "Message" }
  };

  const initContactForm = () => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const alertBox     = document.getElementById("formAlert");
    const alertMsg     = document.getElementById("formAlertMessage");
    const projectBox   = document.getElementById("projectBox");
    const projectInfo  = document.getElementById("projectInfo");
    const projectName  = document.getElementById("projectName");
    const projectSel   = document.getElementById("project");
    const userBox      = document.getElementById("userBox");
    const consentBox   = document.getElementById("consentBox");
    const submitBox    = document.getElementById("submitBox");
    const successBox   = document.getElementById("success");
    const referenceEl  = document.getElementById("reference");
    const newEnquiryBtn= document.getElementById("newEnquiry");

    /* Populate project dropdown */
    if (projectSel) {
      getProjectOptions().forEach(({ id, title }) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = title;
        projectSel.appendChild(opt);
      });
    }

    /* --- Show / hide helpers --------------------------------- */
    const show = (el) => el && el.classList.remove("d-none");
    const hide = (el) => el && el.classList.add("d-none");
    const setAlert = (msg) => {
      if (!alertBox || !alertMsg) return;
      if (msg) {
        alertMsg.textContent = msg;
        show(alertBox);
      } else {
        hide(alertBox);
      }
    };

    const hideAllBlocks = () => {
      Object.values(BLOCK_MAP).forEach((id) => hide(document.getElementById(id)));
    };

    const clearValidation = () => {
      form.querySelectorAll(".is-invalid").forEach((el) =>
        el.classList.remove("is-invalid")
      );
      setAlert(null);
    };

    /* --- Main show/hide logic per type ----------------------- */
    const showForm = (type) => {
      hideAllBlocks();
      clearValidation();

      // Always show user + consent + submit once a type is picked
      show(userBox);
      show(consentBox);
      show(submitBox);

      // Project selector only for hire / project
      if (TYPES_WITH_PROJECT.includes(type)) {
        show(projectBox);
      } else {
        hide(projectBox);
        hide(projectInfo);
      }

      const blockId = BLOCK_MAP[type];
      if (blockId) show(document.getElementById(blockId));
    };

    /* --- Read a URL query param ----------------------------- */
    const params    = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    const source    = params.get("source");

    /* Pre-select project from URL */
    if (projectId && projectSel) {
      const match = getProjectOptions().find((project) => project.id === projectId);
      if (match) {
        projectSel.value = projectId;
        projectName.textContent = match.title;
        show(projectInfo);
      }
    }

    /* --- Radio change handler ------------------------------- */
    form.querySelectorAll('input[name="enquiry"]').forEach((radio) => {
      radio.addEventListener("change", (e) => showForm(e.target.value));
    });

    /* --- Project dropdown change ---------------------------- */
    projectSel?.addEventListener("change", function () {
      const id = this.value;
      const match = getProjectOptions().find((project) => project.id === id);
      if (match) {
        projectName.textContent = match.title;
        show(projectInfo);
      } else {
        hide(projectInfo);
      }
    });

    /* --- Validation ----------------------------------------- */
    const validate = () => {
      const type = form.querySelector('input[name="enquiry"]:checked')?.value;
      if (!type) {
        setAlert("Please select an enquiry type.");
        return { ok: false, focus: null };
      }

      // Check user details
      const name  = document.getElementById("name");
      const email = document.getElementById("email");
      const consent = document.getElementById("consent");

      const markInvalid = (el, msg) => {
        el.classList.add("is-invalid");
        setAlert(msg);
        return el;
      };

      if (!name.value.trim()) return { ok: false, focus: markInvalid(name, "Please enter your name.") };
      if (!email.value.trim()) return { ok: false, focus: markInvalid(email, "Please enter your email.") };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
        return { ok: false, focus: markInvalid(email, "Please enter a valid email address.") };

      // Project required for hire/project
      if (TYPES_WITH_PROJECT.includes(type) && projectSel && !projectSel.value) {
        return { ok: false, focus: markInvalid(projectSel, "Please select a project.") };
      }

      // Type-specific required fields
      const required = REQUIRED_FIELDS[type] || {};
      for (const [id, label] of Object.entries(required)) {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
          return { ok: false, focus: markInvalid(el, `Please fill in: ${label}.`) };
        }
      }

      // Consent
      if (!consent.checked) {
        setAlert("Please agree to be contacted.");
        consent.focus();
        return { ok: false, focus: consent };
      }

      setAlert(null);
      return { ok: true };
    };

    /* --- Clear invalid state on input ----------------------- */
    form.addEventListener("input", (e) => {
      if (e.target.classList?.contains("is-invalid")) {
        e.target.classList.remove("is-invalid");
      }
    });

    /* --- Submit --------------------------------------------- */
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const { ok, focus } = validate();
      if (!ok) {
        focus?.focus();
        return;
      }

      // Simulate submission (frontend-only for now)
      const refNumber = String(Math.floor(10000 + Math.random() * 90000));
      referenceEl.textContent = `#IEI-${new Date().getFullYear()}-${refNumber}`;

      hide(form);
      show(successBox);
      successBox.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    });

    /* --- Reset for "New Enquiry" ---------------------------- */
    newEnquiryBtn?.addEventListener("click", () => {
      form.reset();
      hideAllBlocks();
      hide(userBox);
      hide(consentBox);
      hide(submitBox);
      hide(projectBox);
      hide(projectInfo);
      clearValidation();
      show(form);
      hide(successBox);
      form.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    });

    /* --- Auto-select type from URL (?source=hire) ----------- */
    if (source) {
      const radio = form.querySelector(`input[name="enquiry"][value="${source}"]`);
      if (radio) {
        radio.checked = true;
        showForm(source);
      }
    }
  };

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------------------------------------
     Boot — after includes are loaded (so header/footer exist)
     -------------------------------------------------------- */
  const boot = () => {
    if (Array.isArray(window.IEI_PROJECTS)) {
      initContactForm();
    } else {
      document.addEventListener("iei:projects-ready", initContactForm, { once: true });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
/* ============================================================
   PROJECTS PAGE — static data, rendering, search, filter, sort
   Loaded on every page but only activates if #projectGrid exists.
   ------------------------------------------------------------------
   NOTE: This is intentionally shaped like an API response so that
   replacing PROJECT_DATA with a fetch() call later is trivial.
   ============================================================ */

(() => {
  "use strict";

  /* --------------------------------------------------------
     1. STATIC PROJECT DATA
     Replace this array with fetched data later.
     Each item matches the schema expected from api/projects.php.
     -------------------------------------------------------- */
  const PROJECT_DATA = [
    {
  id: "project-1",
  title: "College Website Redesign",
  shortDescription: "A modern, accessible redesign of the college website with a focus on performance and mobile-first UX.",
  description: "A complete redesign of the college website...",
  problem: "The existing college website was slow, difficult to navigate on mobile, and failed basic accessibility checks.",
  solution: "We rebuilt the site with semantic HTML, modern CSS, and a mobile-first information architecture, improving Lighthouse scores across the board.",
  objective: "Deliver a fast, accessible, and easy-to-maintain website that serves students, faculty, and visitors equally well.",
  features: [
    "Mobile-first responsive layout",
    "WCAG AA accessibility compliant",
    "Optimized Core Web Vitals",
    "Clean and maintainable codebase"
  ],
  status: "Completed",
  category: "web",
  categoryLabel: "Web Development",
  technologies: ["HTML", "CSS", "JavaScript", "Bootstrap"],
  developer: {
    name: "Aarav Deshmukh",
    role: "Team Lead · Frontend",
    department: "Information Technology",
    photo: "",
    email: "aarav@example.com",
    phone: "",
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    skills: ["React", "CSS Architecture", "Accessibility"]
  },
  media: [
    { type: "image", src: "assets/images/projects/college-website.jpg", alt: "Homepage preview" },
    { type: "image", src: "assets/images/projects/college-website-2.jpg", alt: "Mobile view preview" },
    { type: "video", src: "", poster: "assets/images/projects/college-website.jpg" }
  ],
  image: "assets/images/projects/college-website.jpg", // legacy fallback
  createdAt: "2026-01-15",
  liveUrl: "",
  githubUrl: ""
},
    {
      id: "project-2",
      title: "Smart Campus Navigation",
      shortDescription:
        "An interactive campus map with indoor routing, AR hints, and live event overlays for students and visitors.",
      description:
        "Cross-platform mobile app that helps new students and visitors navigate the campus. Includes indoor routing, event overlays, and optional augmented-reality hints.",
      category: "mobile",
      categoryLabel: "Mobile Development",
      technologies: ["Flutter", "Dart", "Firebase"],
      developer: "Ishita Kulkarni",
      developerRole: "Mobile Engineer",
      image: "assets/images/projects/smart-campus.jpg",
      createdAt: "2026-02-04",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "project-3",
      title: "Women Safety Companion",
      shortDescription:
        "A safety app with one-tap SOS, live location sharing, and trusted-contact alerts for students travelling late.",
      description:
        "Mobile-first safety companion designed with input from the campus community. Features one-tap SOS, live location sharing with trusted contacts, and safe-route suggestions.",
      category: "mobile",
      categoryLabel: "Mobile Development",
      technologies: ["React Native", "Node.js", "MongoDB"],
      developer: "Sneha Patil",
      developerRole: "Full-stack Developer",
      image: "assets/images/projects/women-safety.jpg",
      createdAt: "2026-01-22",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "project-4",
      title: "Crop Health Predictor",
      shortDescription:
        "A machine-learning model that classifies crop-leaf diseases from images and suggests corrective actions.",
      description:
        "Deep-learning model trained on public crop-leaf datasets to detect common diseases. Includes a lightweight web interface for uploading a leaf photo and receiving a diagnosis.",
      category: "ai",
      categoryLabel: "AI / Machine Learning",
      technologies: ["Python", "TensorFlow", "Flask"],
      developer: "Rohan Jadhav",
      developerRole: "ML Engineer",
      image: "assets/images/projects/crop-health.jpg",
      createdAt: "2025-12-10",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "project-5",
      title: "Smart Water Meter",
      shortDescription:
        "An IoT device that measures and reports household water usage in real time to reduce waste.",
      description:
        "Low-cost IoT water meter built on ESP32 with a cloud dashboard for households to monitor consumption patterns and detect leaks.",
      category: "iot",
      categoryLabel: "IoT",
      technologies: ["ESP32", "MQTT", "React"],
      developer: "Kabir Sharma",
      developerRole: "Embedded Developer",
      image: "assets/images/projects/smart-water.jpg",
      createdAt: "2025-11-18",
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      id: "project-6",
      title: "Autonomous Line-Following Bot",
      shortDescription:
        "A robotics kit designed for first-year students to learn PID control and sensor fusion hands-on.",
      description:
        "Educational robotics platform with an Arduino-based line-following bot, PID tuning guide, and extension modules for obstacle avoidance.",
      category: "robotics",
      categoryLabel: "Robotics",
      technologies: ["Arduino", "C++", "PID Control"],
      developer: "IEI Robotics Team",
      developerRole: "Student Chapter Initiative",
      image: "assets/images/projects/line-follower.jpg",
      createdAt: "2025-10-05",
      liveUrl: "#",
      githubUrl: "#"
    }
  ];

  /* Make project data available synchronously to the details and contact pages. */
  window.IEI_PROJECTS = PROJECT_DATA;
  document.dispatchEvent(new Event("iei:projects-ready"));

  /* Recommended ordering — highest priority first.
     Uses array order as a proxy for "recommended" for now. */
  const RECOMMENDED_ORDER = PROJECT_DATA.map((p) => p.id);

  /* --------------------------------------------------------
     2. STATE
     -------------------------------------------------------- */
  const state = {
    query: "",
    category: "all",
    sort: "recommended",
    results: PROJECT_DATA.slice()
  };

  /* --------------------------------------------------------
     3. HELPERS
     -------------------------------------------------------- */
  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const categoryLabelFor = (value) => {
    if (value === "all") return "All";
    const found = PROJECT_DATA.find((p) => p.category === value);
    return found ? found.categoryLabel : value;
  };

  const initialsFor = (name) =>
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");

  const developerNameFor = (project) =>
    typeof project.developer === "string"
      ? project.developer
      : project.developer?.name || "";

  const developerRoleFor = (project) =>
    project.developerRole ||
    (typeof project.developer === "object" ? project.developer?.role : "") ||
    "";

  const formatDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  /* --------------------------------------------------------
     4. FILTER + SORT PIPELINE
     -------------------------------------------------------- */
  const applyFilters = (items) => {
    const q = state.query.trim().toLowerCase();
    let out = items.slice();

    if (q) {
      out = out.filter((p) => {
        const haystack = [
          p.title,
          p.shortDescription,
          p.description,
          p.category,
          p.categoryLabel,
          developerNameFor(p),
          developerRoleFor(p),
          ...(p.technologies || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (state.category && state.category !== "all") {
      out = out.filter((p) => p.category === state.category);
    }

    return out;
  };

  const applySort = (items) => {
    const out = items.slice();
    switch (state.sort) {
      case "newest":
        out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        out.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "az":
        out.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
        break;
      case "za":
        out.sort((a, b) => b.title.localeCompare(a.title, "en", { sensitivity: "base" }));
        break;
      case "recommended":
      default:
        out.sort(
          (a, b) => RECOMMENDED_ORDER.indexOf(a.id) - RECOMMENDED_ORDER.indexOf(b.id)
        );
        break;
    }
    return out;
  };

  /* --------------------------------------------------------
     5. CARD TEMPLATE
     -------------------------------------------------------- */
  const renderCard = (p) => {
    const tags = (p.technologies || [])
      .map((t) => `<li><span class="tech-tag">${escapeHtml(t)}</span></li>`)
      .join("");
    const developerName = developerNameFor(p);
    const developerRole = developerRoleFor(p);

    const viewUrl = `projectDetails.html?id=${encodeURIComponent(p.id)}`;
    const hireUrl = `ContactUs.html?project=${encodeURIComponent(p.id)}&source=hire`;

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="project-card h-100" data-project-id="${escapeHtml(p.id)}">
          <div class="project-card-media">
            <img src="${escapeHtml(p.image)}"
                 alt="Preview of ${escapeHtml(p.title)}"
                 loading="lazy"
                 decoding="async">
            <span class="project-card-category">${escapeHtml(p.categoryLabel || p.category)}</span>
          </div>

          <div class="project-card-body">
            <h3 class="project-card-title">
              <a href="${viewUrl}" class="stretched-link-title">${escapeHtml(p.title)}</a>
            </h3>

            <p class="project-card-desc">${escapeHtml(p.shortDescription)}</p>

            <ul class="project-card-tags" aria-label="Technologies used">
              ${tags}
            </ul>

            <div class="project-card-developer">
              <span class="project-card-avatar" aria-hidden="true">${escapeHtml(initialsFor(developerName))}</span>
              <div class="project-card-developer-info">
                <p class="project-card-developer-name">${escapeHtml(developerName)}</p>
                <p class="project-card-developer-role">${escapeHtml(developerRole)}</p>
              </div>
            </div>

            <div class="project-card-actions">
              <a href="${viewUrl}" class="btn-iei btn-iei-sm">
                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                View Project
              </a>
              <a href="${hireUrl}" class="btn-iei-outline btn-iei-sm">
                <i class="bi bi-briefcase" aria-hidden="true"></i>
                Hire Team
              </a>
            </div>
          </div>
        </article>
      </div>
    `;
  };

  /* --------------------------------------------------------
     6. RENDERING
     -------------------------------------------------------- */
  const els = {};

  const renderActiveFilters = () => {
    const chips = [];
    if (state.query.trim()) {
      chips.push({
        type: "query",
        label: `Search: “${state.query.trim()}”`
      });
    }
    if (state.category && state.category !== "all") {
      chips.push({
        type: "category",
        value: state.category,
        label: categoryLabelFor(state.category)
      });
    }

    if (!chips.length) {
      els.activeFilters.classList.add("d-none");
      els.activeFilterChips.innerHTML = "";
      return;
    }

    els.activeFilters.classList.remove("d-none");
    els.activeFilterChips.innerHTML = chips
      .map(
        (c) => `
        <span class="filter-pill">
          ${escapeHtml(c.label)}
          <button type="button"
                  class="filter-pill-remove"
                  data-filter-remove="${escapeHtml(c.type)}"
                  ${c.value ? `data-filter-value="${escapeHtml(c.value)}"` : ""}
                  aria-label="Remove filter ${escapeHtml(c.label)}">
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </span>
      `
      )
      .join("");
  };

  const renderResultsInfo = (shown, total) => {
    const active = state.query.trim() || (state.category && state.category !== "all");
    if (!active) {
      els.resultsInfo.textContent = `${total} ${total === 1 ? "Project" : "Projects"}`;
    } else {
      els.resultsInfo.textContent = `Showing ${shown} of ${total} projects`;
    }
  };

  const render = () => {
    const filtered = applyFilters(PROJECT_DATA);
    const sorted = applySort(filtered);
    state.results = sorted;

    renderActiveFilters();
    renderResultsInfo(sorted.length, PROJECT_DATA.length);

    if (!sorted.length) {
      els.projectGrid.innerHTML = "";
      els.projectGrid.classList.add("d-none");
      els.emptyState.classList.remove("d-none");
      return;
    }

    els.emptyState.classList.add("d-none");
    els.projectGrid.classList.remove("d-none");
    els.projectGrid.innerHTML = sorted.map(renderCard).join("");
  };

  /* --------------------------------------------------------
     7. EVENT WIRING
     -------------------------------------------------------- */
  const syncCategoryUI = () => {
    document.querySelectorAll('[data-category]').forEach((btn) => {
      const match = btn.getAttribute("data-category") === state.category;
      btn.classList.toggle("is-active", match);
      btn.setAttribute("aria-pressed", match ? "true" : "false");
    });
  };

  const syncSortUI = () => {
    document.querySelectorAll('[data-sort]').forEach((btn) => {
      const match = btn.getAttribute("data-sort") === state.sort;
      btn.classList.toggle("is-active", match);
      btn.setAttribute("aria-pressed", match ? "true" : "false");
    });
  };

  const clearAll = () => {
    state.query = "";
    state.category = "all";
    state.sort = "recommended";
    if (els.search) els.search.value = "";
    syncCategoryUI();
    syncSortUI();
    render();
  };

  const closeMobileFilterDrawer = () => {
    const drawer = document.getElementById("filterDrawer");
    if (!drawer || !window.bootstrap) return;
    const inst = window.bootstrap.Offcanvas.getInstance(drawer);
    inst?.hide();
  };

  const initProjectsPage = () => {
    els.projectGrid        = document.getElementById("projectGrid");
    els.emptyState         = document.getElementById("emptyState");
    els.resultsInfo        = document.getElementById("resultsInfo");
    els.activeFilters      = document.getElementById("activeFilters");
    els.activeFilterChips  = document.getElementById("activeFilterChips");
    els.search             = document.getElementById("projectSearch");
    els.clearAll           = document.getElementById("clearAllFilters");
    els.clearEmpty         = document.getElementById("clearFiltersEmpty");

    if (!els.projectGrid) return; // Not on the projects page.

    /* Search (debounced) */
    let searchTimer;
    els.search?.addEventListener("input", (e) => {
      const value = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = value;
        render();
      }, 120);
    });

    /* Category selection (works for desktop dropdown + mobile chips) */
    document.addEventListener("click", (e) => {
      const catBtn = e.target.closest("[data-category]");
      if (catBtn) {
        state.category = catBtn.getAttribute("data-category") || "all";
        syncCategoryUI();
        render();
        closeMobileFilterDrawer();
        return;
      }

      const sortBtn = e.target.closest("[data-sort]");
      if (sortBtn) {
        state.sort = sortBtn.getAttribute("data-sort") || "recommended";
        syncSortUI();
        render();
        return;
      }

      const removeBtn = e.target.closest("[data-filter-remove]");
      if (removeBtn) {
        const type = removeBtn.getAttribute("data-filter-remove");
        if (type === "query") {
          state.query = "";
          if (els.search) els.search.value = "";
        } else if (type === "category") {
          state.category = "all";
          syncCategoryUI();
        }
        render();
      }
    });

    /* Clear buttons */
    els.clearAll?.addEventListener("click", clearAll);
    els.clearEmpty?.addEventListener("click", clearAll);

    /* Keyboard shortcut: "/" focuses search */
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) {
        e.preventDefault();
        els.search?.focus();
      }
    });

    /* Initial paint */
    syncCategoryUI();
    syncSortUI();
    render();
  };

  /* --------------------------------------------------------
     8. BOOT
     -------------------------------------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectsPage, { once: true });
  } else {
    initProjectsPage();
  }
})();