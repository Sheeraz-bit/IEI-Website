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
  const IEI = (window.__IEI = window.__IEI || {});
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  IEI.qs = qs;
  IEI.qsa = qsa;
  IEI.prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  IEI.escapeHtml = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  IEI.initialsFor = (name) =>
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  IEI.formatDate = (iso) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  IEI.getDeveloper = (project) => {
    const developer = project.developer;
    if (typeof developer === "string") {
      return {
        name: developer,
        role: project.developerRole || "",
        department: "",
        photo: "",
        email: "",
        phone: "",
        github: project.githubUrl && project.githubUrl !== "#" ? project.githubUrl : "",
        linkedin: "",
        skills: [],
      };
    }
    if (developer && typeof developer === "object") {
      return {
        name: developer.name || "",
        role: developer.role || project.developerRole || "",
        department: developer.department || "",
        photo: developer.photo || "",
        email: developer.email || "",
        phone: developer.phone || "",
        github: developer.github || "",
        linkedin: developer.linkedin || "",
        skills: Array.isArray(developer.skills) ? developer.skills : [],
      };
    }
    return {
      name: "",
      role: project.developerRole || "",
      department: "",
      photo: "",
      email: "",
      phone: "",
      github: "",
      linkedin: "",
      skills: [],
    };
  };
  IEI.observeReveals = () => {
    const nodes = qsa(".reveal:not(.is-visible)");
    if (!nodes.length) return;
    if (IEI.prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    nodes.forEach((node) => observer.observe(node));
  };
  const prefersReducedMotion = IEI.prefersReducedMotion();

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
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth >= 992 && sidebar.classList.contains("is-open"))
          close();
      },
      { passive: true },
    );

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

  const IEI = window.__IEI;

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
      const radio = Array.from(
        form.querySelectorAll('input[name="enquiry"]'),
      ).find((input) => input.value === source);
      if (radio) {
        radio.checked = true;
        showForm(source);
      }
    }
  };

  const prefersReducedMotion = IEI.prefersReducedMotion;

  /* --------------------------------------------------------
     Boot — after includes are loaded (so header/footer exist)
     -------------------------------------------------------- */
  const boot = () => {
    if (Array.isArray(window.IEI_PROJECTS)) {
      initContactForm();
    } else {
      let initialized = false;
      const initializeOnce = () => {
        if (initialized) return;
        initialized = true;
        clearTimeout(fallbackTimer);
        initContactForm();
      };
      const fallbackTimer = setTimeout(initializeOnce, 500);
      document.addEventListener("iei:projects-ready", initializeOnce, {
        once: true,
      });
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

  const IEI = window.__IEI;

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
  const escapeHtml = IEI.escapeHtml;

  const categoryLabelFor = (value) => {
    if (value === "all") return "All";
    const found = PROJECT_DATA.find((p) => p.category === value);
    return found ? found.categoryLabel : value;
  };

  const initialsFor = IEI.initialsFor;

  const developerNameFor = (project) => IEI.getDeveloper(project).name;

  const developerRoleFor = (project) => IEI.getDeveloper(project).role;

  const formatDate = IEI.formatDate;

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
      const target = e.target;
      if (
        e.key !== "/" ||
        (target instanceof HTMLElement &&
          target.matches("input, textarea, select")) ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(
          document.activeElement?.tagName || "",
        )
      ) {
        return;
      }
      e.preventDefault();
      els.search?.focus();
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

/* ============================================================
   PROJECT DETAILS PAGE — reads ?id=, renders case-study view
   Activates only if #projectContent exists on the page.
   Uses window.IEI_PROJECTS (shared with the Projects page).
   ============================================================ */

(() => {
  "use strict";

  const IEI = window.__IEI;

  /* --------------------------------------------------------
     Helpers
     -------------------------------------------------------- */
  const qs = IEI.qs;
  const escapeHtml = IEI.escapeHtml;

  const paraHtml = (text) =>
    escapeHtml(text)
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("");

  const initialsFor = IEI.initialsFor;
  const formatDate = IEI.formatDate;

  /* --------------------------------------------------------
     Fallback schema normalizer
     Accepts two shapes:
       a) The projects-page shape:  { developer: "Name", developerRole, image, ... }
       b) The richer shape:         { developer: { name, role, photo, ... }, media: [...] }
     Both end up rendering correctly without touching the data.
     -------------------------------------------------------- */
  const normalizeProject = (p) => {
    const out = { ...p };

    // Developer → always an object with a `.name`
    if (typeof p.developer === "string") {
      out.developer = {
        name: p.developer,
        role: p.developerRole || "",
        department: "",
        photo: "",
        email: "",
        phone: "",
        github: p.githubUrl && p.githubUrl !== "#" ? p.githubUrl : "",
        linkedin: "",
        skills: []
      };
    } else if (p.developer && typeof p.developer === "object") {
      out.developer = {
        name: p.developer.name || "Student Developer",
        role: p.developer.role || "",
        department: p.developer.department || "",
        photo: p.developer.photo || "",
        email: p.developer.email || "",
        phone: p.developer.phone || "",
        github: p.developer.github || "",
        linkedin: p.developer.linkedin || "",
        skills: Array.isArray(p.developer.skills) ? p.developer.skills : []
      };
    } else {
      out.developer = {
        name: "Student Developer",
        role: "",
        department: "",
        photo: "",
        email: "",
        phone: "",
        github: "",
        linkedin: "",
        skills: []
      };
    }

    // Media → always an array of { type, src, alt?, poster? }
    if (!Array.isArray(out.media) || !out.media.length) {
      out.media = [
        {
          type: "image",
          src: p.image || "",
          alt: `${p.title || "Project"} preview image`
        }
      ].filter((m) => m.src);
    }

    // Extended content blocks (optional)
    out.problem   = p.problem   || "";
    out.solution  = p.solution  || "";
    out.features  = Array.isArray(p.features) ? p.features : [];
    out.objective = p.objective || "";

    // Status (optional)
    out.status = p.status || "";

    return out;
  };

  /* --------------------------------------------------------
     Main
     -------------------------------------------------------- */
  const initProjectDetails = () => {
    const contentSection = document.getElementById("projectContent");
    const notFoundSection = document.getElementById("notFoundSection");
    if (!contentSection) return; // Not on the details page.

    const data = Array.isArray(window.IEI_PROJECTS) ? window.IEI_PROJECTS : [];
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const raw = data.find((p) => p.id === id);
    if (!raw) {
      notFoundSection?.classList.remove("d-none");
      return;
    }
    const project = normalizeProject(raw);
    contentSection.classList.remove("d-none");

    /* --------------------------------------------------
       1. HERO
       -------------------------------------------------- */
    const heroCategory = qs("#heroCategory");
    const heroTitle = qs("#heroTitle");
    const heroShort = qs("#heroShortDescription");
    const heroTags = qs("#heroTags");
    const heroDev = qs("#heroDeveloper");
    const bcCurrent = qs("#breadcrumbCurrent");

    if (heroCategory) heroCategory.textContent = project.categoryLabel || project.category || "Project";
    if (heroTitle)   heroTitle.textContent = project.title || "Project";
    if (heroShort)   heroShort.textContent = project.shortDescription || "";
    if (heroDev)     heroDev.textContent = project.developer.name;
    if (bcCurrent)   bcCurrent.textContent = project.title || "Project";

    if (heroTags) {
      heroTags.innerHTML = (project.technologies || [])
        .map((t) => `<li><span class="tech-tag" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.28);color:#fff;">${escapeHtml(t)}</span></li>`)
        .join("");
    }

    /* Hire buttons */
    const hireUrl = `ContactUs.html?project=${encodeURIComponent(project.id)}&source=hire`;
    const heroHireBtn = qs("#heroHireBtn");
    const ctaHireBtn = qs("#ctaHireBtn");
    if (heroHireBtn) heroHireBtn.href = hireUrl;
    if (ctaHireBtn)  ctaHireBtn.href  = hireUrl;

    /* Document title */
    document.title = `${project.title || "Project"} — IEI Student Chapter`;

    /* --------------------------------------------------
       2. MEDIA GALLERY
       -------------------------------------------------- */
    const mediaMain = qs("#mediaMain");
    const mediaThumbs = qs("#mediaThumbs");
    const mediaModalEl = document.getElementById("mediaModal");
    const mediaModalBody = qs("#mediaModalBody");
    const mediaModalLabel = qs("#mediaModalLabel");
    const mediaModal = mediaModalEl && window.bootstrap
      ? new window.bootstrap.Modal(mediaModalEl)
      : null;

    const renderMediaMain = (m) => {
      if (!m || !m.src) {
        mediaMain.innerHTML = `
          <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted-iei">
            <i class="bi bi-image" style="font-size:2rem;" aria-hidden="true"></i>
            <p class="mb-0 mt-2">No media available</p>
          </div>`;
        return;
      }
      if (m.type === "video") {
        mediaMain.innerHTML = `
          <video controls preload="metadata" ${m.poster ? `poster="${escapeHtml(m.poster)}"` : ""}>
            <source src="${escapeHtml(m.src)}">
            Your browser does not support the video tag.
          </video>`;
      } else {
        mediaMain.innerHTML = `
          <button type="button" class="media-trigger"
                  aria-label="Open image larger: ${escapeHtml(m.alt || "")}"
                  data-media-index="${project.media.indexOf(m)}">
            <img src="${escapeHtml(m.src)}" alt="${escapeHtml(m.alt || "")}" loading="lazy" decoding="async">
          </button>`;
      }
    };

    const renderMediaThumbs = () => {
      if (!mediaThumbs) return;
      if (project.media.length <= 1) {
        mediaThumbs.innerHTML = "";
        return;
      }
      mediaThumbs.innerHTML = project.media
        .map((m, i) => {
          const isActive = i === 0 ? "is-active" : "";
          const poster = m.type === "video" ? (m.poster || m.src) : m.src;
          const overlay = m.type === "video"
            ? `<span class="media-thumb-type" aria-hidden="true"><i class="bi bi-play-circle-fill"></i></span>`
            : "";
          return `
            <button type="button"
              class="media-thumb ${isActive}"
              aria-label="Show ${m.type} ${i + 1}"
              data-media-index="${i}">
              <img src="${escapeHtml(poster)}" alt="" loading="lazy" decoding="async">
              ${overlay}
            </button>`;
        })
        .join("");
    };

    const setActiveThumb = (index) => {
      mediaThumbs?.querySelectorAll(".media-thumb").forEach((el) => {
        el.classList.toggle("is-active", Number(el.dataset.mediaIndex) === index);
      });
    };

    const openLightbox = (m) => {
      if (!mediaModal || !mediaModalBody) return;
      if (m.type === "video") {
        mediaModalBody.innerHTML = `
          <video controls preload="metadata" class="w-100" ${m.poster ? `poster="${escapeHtml(m.poster)}"` : ""}>
            <source src="${escapeHtml(m.src)}">
            Your browser does not support the video tag.
          </video>`;
        if (mediaModalLabel) mediaModalLabel.textContent = "Project Video";
      } else {
        mediaModalBody.innerHTML = `
          <img src="${escapeHtml(m.src)}" alt="${escapeHtml(m.alt || "")}">`;
        if (mediaModalLabel) mediaModalLabel.textContent = m.alt || "Project Image";
      }
      mediaModal.show();
    };

    /* Clear modal body when hidden to stop video playback */
    mediaModalEl?.addEventListener("hidden.bs.modal", () => {
      if (mediaModalBody) mediaModalBody.innerHTML = "";
    });

    /* Delegated: thumbs select; main image opens lightbox */
    mediaThumbs?.addEventListener("click", (e) => {
      const btn = e.target.closest(".media-thumb");
      if (!btn) return;
      const idx = Number(btn.dataset.mediaIndex);
      const m = project.media[idx];
      if (!m) return;
      setActiveThumb(idx);
      renderMediaMain(m);
    });

    mediaMain?.addEventListener("click", (e) => {
      const btn = e.target.closest(".media-trigger");
      if (!btn) return;
      const idx = Number(btn.dataset.mediaIndex);
      const m = project.media[idx];
      if (m) openLightbox(m);
    });

    /* Initial paint */
    renderMediaMain(project.media[0]);
    renderMediaThumbs();

    /* --------------------------------------------------
       3. PROJECT SUMMARY
       -------------------------------------------------- */
    const summary = qs("#projectSummary");
    if (summary) {
      const rows = [];
      const addRow = (label, value) => {
        if (!value) return;
        rows.push(`
          <div class="summary-row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${value}</dd>
          </div>`);
      };

      addRow("Category", escapeHtml(project.categoryLabel || project.category || ""));
      addRow(
        "Technologies",
        (project.technologies || []).map((t) => escapeHtml(t)).join(", ") || ""
      );
      addRow("Status", escapeHtml(project.status || ""));
      addRow("Developer", escapeHtml(project.developer.name));
      addRow("Department", escapeHtml(project.developer.department));
      addRow("Published", escapeHtml(formatDate(project.createdAt)));

      summary.innerHTML = rows.length
        ? rows.join("")
        : `<p class="mb-0 text-muted-iei">No additional details available.</p>`;
    }

    /* --------------------------------------------------
       4. DESCRIPTION
       -------------------------------------------------- */
    const desc = qs("#projectDescription");
    if (desc) {
      const parts = [];

      if (project.problem) {
        parts.push(`<h3>The Problem</h3>${paraHtml(project.problem)}`);
      }
      if (project.solution) {
        parts.push(`<h3>The Solution</h3>${paraHtml(project.solution)}`);
      }
      if (project.objective) {
        parts.push(`<h3>Objective</h3>${paraHtml(project.objective)}`);
      }
      if (Array.isArray(project.features) && project.features.length) {
        parts.push(
          `<h3>Key Features</h3><ul>${project.features
            .map((f) => `<li>${escapeHtml(f)}</li>`)
            .join("")}</ul>`
        );
      }

      // Fallback: long-form description if no structured blocks exist
      if (!parts.length) {
        const text = project.description || project.shortDescription || "";
        parts.push(`<p>${escapeHtml(text)}</p>`);
      }

      desc.innerHTML = parts.join("");
    }

    /* --------------------------------------------------
       5. DEVELOPER
       -------------------------------------------------- */
    const devSection = qs("#developerSection");
    if (devSection) {
      const d = project.developer;
      const photoHtml = d.photo
        ? `<span class="developer-photo"><img src="${escapeHtml(d.photo)}" alt="${escapeHtml(d.name)}"></span>`
        : `<span class="developer-photo" aria-hidden="true">${escapeHtml(initialsFor(d.name))}</span>`;

      const skillsHtml = (d.skills || []).length
        ? `<ul class="developer-skills" aria-label="Skills">
             ${d.skills.map((s) => `<li><span class="tech-tag">${escapeHtml(s)}</span></li>`).join("")}
           </ul>`
        : "";

      const contactItems = [];
      if (d.email) contactItems.push(`<li><a href="mailto:${escapeHtml(d.email)}"><i class="bi bi-envelope" aria-hidden="true"></i>Email</a></li>`);
      if (d.phone) contactItems.push(`<li><a href="tel:${escapeHtml(d.phone)}"><i class="bi bi-telephone" aria-hidden="true"></i>Phone</a></li>`);
      if (d.linkedin) contactItems.push(`<li><a href="${escapeHtml(d.linkedin)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-linkedin" aria-hidden="true"></i>LinkedIn</a></li>`);
      if (d.github) contactItems.push(`<li><a href="${escapeHtml(d.github)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github" aria-hidden="true"></i>GitHub</a></li>`);

      const contactHtml = contactItems.length
        ? `<ul class="developer-contact">${contactItems.join("")}</ul>`
        : "";

      devSection.innerHTML = `
        <div class="col-12 col-lg-8">
          <article class="developer-card">
            <div class="developer-card-head">
              ${photoHtml}
              <div>
                <h3 class="developer-name">${escapeHtml(d.name)}</h3>
                ${d.role ? `<p class="developer-role">${escapeHtml(d.role)}</p>` : ""}
                ${d.department ? `<p class="developer-department">${escapeHtml(d.department)}</p>` : ""}
              </div>
            </div>
            ${skillsHtml}
            ${contactHtml}
          </article>
        </div>`;
    }

    /* --------------------------------------------------
       6. PROJECT LINKS
       -------------------------------------------------- */
    const links = qs("#projectLinks");
    if (links) {
      const btns = [];
      if (project.liveUrl && project.liveUrl !== "#") {
        btns.push(`
          <a href="${escapeHtml(project.liveUrl)}"
             class="btn-iei btn-iei-lg"
             target="_blank" rel="noopener noreferrer">
            <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
            View Live Project
          </a>`);
      }
      if (project.githubUrl && project.githubUrl !== "#") {
        btns.push(`
          <a href="${escapeHtml(project.githubUrl)}"
             class="btn-iei-outline btn-iei-lg"
             target="_blank" rel="noopener noreferrer">
            <i class="bi bi-github" aria-hidden="true"></i>
            View Source Code
          </a>`);
      }
      links.innerHTML = btns.length
        ? btns.join("")
        : ""; // hide empty container
      if (!btns.length) links.classList.add("d-none");
    }

    /* --------------------------------------------------
       7. RELATED PROJECTS
       -------------------------------------------------- */
    const related = qs("#relatedProjects");
    if (related) {
      const others = data.filter((p) => p.id !== project.id);
      // Rank by shared category first, then by shared technologies.
      const scored = others
        .map((p) => {
          let score = 0;
          if (p.category === project.category) score += 3;
          const sharedTech = (p.technologies || []).filter((t) =>
            (project.technologies || []).includes(t)
          ).length;
          score += sharedTech;
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.p);

      // Top up with most recent if not enough related by score.
      if (scored.length < 3) {
        const fill = others
          .filter((p) => !scored.some((s) => s.id === p.id))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3 - scored.length);
        scored.push(...fill);
      }

      if (!scored.length) {
        related.innerHTML = `<div class="col-12"><p class="text-muted-iei mb-0">No other projects to show yet.</p></div>`;
      } else {
        related.innerHTML = scored.map(renderRelatedCard).join("");
      }
    }

    function renderRelatedCard(p) {
      const normalized = normalizeProject(p);
      const tags = (normalized.technologies || [])
        .slice(0, 3)
        .map((t) => `<li><span class="tech-tag">${escapeHtml(t)}</span></li>`)
        .join("");
      const url = `projectDetails.html?id=${encodeURIComponent(normalized.id)}`;
      const img = normalized.media[0]?.src || normalized.image || "";

      return `
        <div class="col-12 col-md-6 col-lg-4">
          <article class="project-card h-100">
            <div class="project-card-media">
              ${img ? `<img src="${escapeHtml(img)}" alt="Preview of ${escapeHtml(normalized.title)}" loading="lazy" decoding="async">` : ""}
              <span class="project-card-category">${escapeHtml(normalized.categoryLabel || normalized.category || "")}</span>
            </div>
            <div class="project-card-body">
              <h3 class="project-card-title">
                <a href="${url}">${escapeHtml(normalized.title)}</a>
              </h3>
              <p class="project-card-desc">${escapeHtml(normalized.shortDescription || "")}</p>
              <ul class="project-card-tags" aria-label="Technologies used">${tags}</ul>
              <div class="project-card-actions">
                <a href="${url}" class="btn-iei btn-iei-sm">
                  <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                  View Project
                </a>
              </div>
            </div>
          </article>
        </div>`;
    }
  };

  /* --------------------------------------------------------
     Boot
     -------------------------------------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectDetails, { once: true });
  } else {
    initProjectDetails();
  }
})();

/* ============================================================
   ABOUT US PAGE — static data + rendering
   Activates only if #aboutEventsGrid / #aboutTimeline / #councilGrid exist.
   ------------------------------------------------------------
   All data lives here in clearly-labeled arrays so it can later
   be replaced by backend data with minimal changes.
   ============================================================ */

(() => {
  "use strict";

  const IEI = window.__IEI;

  /* --------------------------------------------------------
     Helper
     -------------------------------------------------------- */
  const qs = IEI.qs;
  const escapeHtml = IEI.escapeHtml;
  const initialsFor = IEI.initialsFor;

  /* ============================================================
     SECTION 4 — EVENTS DATA (placeholder-friendly)
     ============================================================ */
  const ABOUT_EVENTS = [
    {
      id: "evt-1",
      title: "HackSpectra 2.0 — Metaverse: Code Beyond Reality",
      category: "Hackathon",
      guest: "Judged by Mr. Deepak Sar, Mr. Devendra Gadekar, Mr. Amit Mirkale, Mr. Dhananjay Kharade, and Mr. Vinod Malode",
      date: "April 2026",
      description:
        "A 24-hour national-level hackathon organised with the Department of CSE & AIML and GDG, where teams built real-world solutions under a strict time window.",
      image: "assets/images/events/675bc050-b80d-48ed-b35e-b8f13c92a925.jpg",
      href: "#"
    },
    {
      id: "evt-2",
      title: "Machine Learning to AI Agents",
      category: "Expert Talk",
      guest: "Mr. Atul Kahate",
      date: "October 2025",
      description:
        "An expert talk by Mr. Atul Kahate on the evolution of Machine Learning, AI agents, and intelligent systems — with real-world industry examples.",
      image: "assets/images/events/f179e9de-109c-45d8-a29e-da33e9599f75.jpg",
      href: "#"
    },
    {
      id: "evt-3",
      title: "Expert Lecture & Hands-On Workshop",
      category: "Workshop",
      guest: "Mr. Mukesh Jain, CTO & EVP at Capgemini",
      date: "September 2026",
      description:
        "A hands-on session by Mr. Mukesh Jain (Capgemini) covering data, analytics, preprocessing, model deployment, and the practical aspects of AI/ML.",
      image: "assets/images/events/fb124c99-aa74-4162-bfac-e80575dff085.jpg",
      href: "#"
    },
    {
      id: "evt-4",
      title: "Inauguration of IEI Students' Chapter",
      category: "Chapter Milestone",
      guest: "Prof. U. V. Kulkarni, Head of CSE, SGGS Nanded",
      date: "October 2025",
      description:
        "Formal inauguration of the IEI Students' Chapter at the Department of CSE — combined with Engineer's Day Celebration and a Digital Poster Making Competition.",
      image: "assets/images/events/2c4ce29e-6358-4b1e-9c72-cff57c18f108.jpg",
      href: "#"
    },
    {
      id: "evt-5",
      title: "Inspiring Journey of India's Defence Preparedness",
      category: "Expert Lecture",
      guest: "Shri Kashinath Damodar Devdhar, DRDO Scientist",
      date: "March 2026",
      description:
        "An expert lecture by DRDO scientist Shri Kashinath Devdhar on India's defence technology journey, indigenous systems, and self-reliance.",
      image: "assets/images/events/55c9c81b-f019-45e4-aef3-ea453f6ef3ef.jpg",
      href: "#"
    },
    {
      id: "evt-6",
      title: "Building Agentic AI Applications from Scratch",
      category: "Technical Session",
      guest: "Mr. Atul Joshi (Infinera) & Mr. Rohan Chandak (IIT Bombay)",
      date: "November 2025",
      description:
        "A one-day workshop on AI fundamentals, agentic architectures, and building real AI applications — with industry experts from Infinera and IIT Bombay.",
      image: "assets/images/events/52585193-2ae3-497a-98da-04b22e74a2e7.jpg",
      href: "#"
    }
  ];

  /* ============================================================
     SECTION 6 — TIMELINE DATA
     ============================================================ */
  const ABOUT_TIMELINE = [
    {
      year: "2025",
      title: "IEI Students' Chapter Inaugurated",
      description:
        "The IEI Students' Chapter was formally inaugurated in the Department of Computer Science and Engineering.",
      category: "Milestone"
    },
    {
      year: "2025",
      title: "Machine Learning to AI Agents",
      description:
        "Expert talk by Mr. Atul Kahate introducing students to modern AI and agent-based systems.",
      category: "Expert Talk"
    },
    {
      year: "2025",
      title: "Building Agentic AI Applications",
      description:
        "One-day workshop on AI fundamentals, agentic architecture, and industry applications.",
      category: "Workshop"
    },
    {
      year: "2026",
      title: "Inspiring Journey of India's Defence Preparedness",
      description:
        "Expert lecture by DRDO scientist Shri Kashinath Devdare on India's indigenous defence technology.",
      category: "Expert Lecture"
    },
    {
      year: "2026",
      title: "HackSpectra 2.0 — Metaverse: Code Beyond Reality",
      description:
        "A 24-hour national-level hackathon in association with the Department of CSE & AIML and GDG.",
      category: "Hackathon"
    },
    {
      year: "2026",
      title: "Expert Lecture & Hands-On Workshop",
      description:
        "Session by Mr. Mukesh Jain (Capgemini) on data, analytics, and modern AI/ML practice.",
      category: "Workshop"
    }
  ];

  /* ============================================================
     SECTION 9 — STUDENT COUNCIL DATA
     ============================================================ */
  const COUNCIL_MEMBERS = [
    // Add a photo URL to any member with photo: "https://example.com/photo.jpg".
    { photo: "./assets/images/profilePicture/president-1.jpg", name: "Vaishnavi Titare",       role: "President I",         cls: "B.Tech CSE-B", group: "leadership", rank: 1 },
    { name: "Sushrut Deshpande",      role: "President II",        cls: "TY CSE-A",     group: "leadership", rank: 2 },
    { name: "Pranjal Shahane",        role: "Vice-President I",    cls: "B.Tech CSE-B", group: "leadership", rank: 1 },
    { name: "Shruti Daware",          role: "Vice-President II",   cls: "TY CSE-A",     group: "leadership", rank: 2 },
    { name: "Shravani Wattamwar",     role: "Vice-President III",  cls: "TY CSE-C",     group: "leadership", rank: 3 },
    { name: "Sukhada Ujlambkar",      role: "Secretary I",         cls: "TY AIML",      group: "leadership", rank: 1 },
    { name: "Vedant Telang",          role: "Secretary II",        cls: "TY CSE-C",     group: "leadership", rank: 2 },
    { name: "Sayali Parkhi",          role: "Secretary III",       cls: "TY CSE-B",     group: "leadership", rank: 3 },
    { name: "Yogesh Tehare",          role: "Joint Secretary I",   cls: "TY CSE-C",     group: "leadership", rank: 1 },
    { name: "Yashvi Nathani",         role: "Joint Secretary II",  cls: "SY CSE-C",     group: "leadership", rank: 2 },
    { photo: "./assets/images/profilePicture/PP-male.jpg", name: "Shaikh Abdul Nabi Sheeraz", role: "Joint Secretary III", cls: "SY AIML",      group: "leadership", rank: 3 },
    { name: "Anushka Swami",          role: "Treasurer I",         cls: "TY CSE-C",     group: "leadership", rank: 1 },
    { name: "Pranjali Shirpure",      role: "Treasurer II",        cls: "SY CSE-C",     group: "leadership", rank: 2 },
    { name: "Shreyash Tekale",        role: "Treasurer III",       cls: "TY CSE-C",     group: "leadership", rank: 3 },
    { name: "Tejas Holkar",           role: "Technical Head I",    cls: "TY AIML",      group: "technical",  rank: 1 },
    { name: "Mohammedi Begum",        role: "Technical Head II",   cls: "SY CSE-C",     group: "technical",  rank: 2 },
    { name: "Arjun Aher",             role: "Technical Head III",  cls: "SY CSE-A",     group: "technical",  rank: 3 },
    { name: "Ayush Bagelikar",        role: "Media Head I",        cls: "TY AIML",      group: "media",      rank: 1 },
    { name: "Atharv Fadanvis",        role: "Media Head II",       cls: "SY CSE-A",     group: "media",      rank: 2 },
    { name: "Samiksha Baheti",        role: "Media Head III",      cls: "SY CSE-A",     group: "media",      rank: 3 },
    { name: "Vanshika Mande",         role: "Media Head IV",       cls: "SY CSE-B",     group: "media",      rank: 4 },
    { name: "Dilesha Dhole",          role: "Magazine Head I",     cls: "TY AIML",      group: "magazine",   rank: 1 },
    { name: "Gajanan Kadam",          role: "Magazine Head II",    cls: "SY CSE-A",     group: "magazine",   rank: 2 },
    { name: "Madhura Potdar",         role: "Board Member",        cls: "TY CSE-C",     group: "board" },
    { name: "Sanjana Kachave",        role: "Board Member",        cls: "SY CSE-B",     group: "board" },
    { name: "Shraddha Shinde",        role: "Board Member",        cls: "SY CSE-C",     group: "board" },
    { name: "Swarup Shinde",          role: "Board Member",        cls: "SY CSE-C",     group: "board" },
    { name: "Shaikh Ummekulsulm",     role: "Board Member",        cls: "SY CSE-C",     group: "board" },
    { name: "Tanvi Kore",             role: "Board Member",        cls: "SY CSE-A",     group: "board" },
    { name: "Mayur Shetkar",          role: "Board Member",        cls: "SY CSE-C",     group: "board" }
  ];

  /* ============================================================
     RENDER — EVENTS GRID (horizontal card layout)
     ============================================================ */
  const renderAboutEvents = () => {
    const grid = document.getElementById("aboutEventsGrid");
    if (!grid) return;
    const empty = document.getElementById("aboutEventsEmpty");

    if (!ABOUT_EVENTS.length) {
      empty?.classList.remove("d-none");
      return;
    }

    grid.innerHTML = ABOUT_EVENTS.map((e, i) => {
      const title = escapeHtml(e.title || "");
      const guest = e.guest ? escapeHtml(e.guest) : "";
      const description = escapeHtml(e.description || "");
      const category = escapeHtml(e.category || "");
      const date = escapeHtml(e.date || "");
      const image = escapeHtml(e.image || "");
      const href = escapeHtml(e.href || "#");

      const guestRow = guest
        ? `<p class="about-event-guest">
             <i class="bi bi-person-badge" aria-hidden="true"></i>
             <span><strong>Chief Guest:</strong> ${guest}</span>
           </p>`
        : "";

      const imageCol = image
        ? `<div class="about-event-thumb">
             <img src="${image}"
                  alt="Preview of ${title}"
                  loading="lazy"
                  decoding="async"
                  onerror="this.style.display='none'">
           </div>`
        : "";

      return `
        <div class="col-12">
          <article class="about-event-card reveal reveal-delay-${i % 4}">
            <div class="about-event-top">
              <div class="about-event-text">
                <div class="about-event-meta-row">
                  <span class="about-event-cat">${category}</span>
                  ${date ? `<span class="about-event-date">
                    <i class="bi bi-calendar-event" aria-hidden="true"></i> ${date}
                  </span>` : ""}
                </div>
                <h3 class="about-event-title">${title}</h3>
                ${guestRow}
              </div>
              ${imageCol}
            </div>

            <p class="about-event-desc">${description}</p>

            <div class="about-event-footer">
              <a href="${href}" class="link-iei" aria-label="View details for ${title}">
                Details <i class="bi bi-arrow-right" aria-hidden="true"></i>
              </a>
            </div>
          </article>
        </div>
      `;
    }).join("");
  };

  /* ============================================================
     RENDER — TIMELINE
     ============================================================ */
  const TIMELINE_VISIBLE_COUNT = 4;
  let timelineExpanded = false;

  const renderTimeline = () => {
    const list = document.getElementById("aboutTimeline");
    if (!list) return;
    const toggle = document.getElementById("aboutTimelineToggle");

    const visible = timelineExpanded
      ? ABOUT_TIMELINE
      : ABOUT_TIMELINE.slice(0, TIMELINE_VISIBLE_COUNT);

    list.innerHTML = visible.map((item, i) => `
      <li class="timeline-item reveal reveal-delay-${i % 4}">
        <span class="timeline-node" aria-hidden="true"></span>
        <div class="timeline-card">
          <span class="timeline-year">${escapeHtml(item.year)}</span>
          <h3 class="timeline-title">${escapeHtml(item.title)}</h3>
          <p class="timeline-desc">${escapeHtml(item.description)}</p>
          <span class="timeline-cat">
            <i class="bi bi-tag" aria-hidden="true"></i> ${escapeHtml(item.category)}
          </span>
        </div>
      </li>
    `).join("");

    if (toggle) {
      if (ABOUT_TIMELINE.length <= TIMELINE_VISIBLE_COUNT) {
        toggle.classList.add("d-none");
      } else {
        toggle.classList.remove("d-none");
        toggle.setAttribute("aria-expanded", String(timelineExpanded));
        toggle.innerHTML = timelineExpanded
          ? `<i class="bi bi-chevron-up" aria-hidden="true"></i> Show Less`
          : `<i class="bi bi-chevron-down" aria-hidden="true"></i> View More`;
      }
    }

    // Re-run reveal observer so newly injected items animate in
    document.dispatchEvent(new Event("about:render"));
  };

  /* ============================================================
     RENDER — STUDENT COUNCIL
     ============================================================ */
  const FEATURED_ROLES = [
    "President I",
    "President II"
  ];

  const renderCouncilFeatured = () => {
    const container = document.getElementById("councilFeatured");
    if (!container) return;

    const featured = COUNCIL_MEMBERS.filter((m) =>
      FEATURED_ROLES.includes(m.role)
    );

    container.innerHTML = featured.map((m) => `
      <div class="featured-card reveal">
        <div class="student-photo" aria-hidden="true">${
            m.photo
              ? `<img src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name)}" onerror="this.parentElement.textContent = this.alt">`
              : `<span class="student-photo-fallback">${escapeHtml(initialsFor(m.name))}</span>`
          }</div>
        <span class="featured-card-role">${escapeHtml(m.role)}</span>
        <h4>${escapeHtml(m.name)}</h4>
        <p class="featured-card-class">${escapeHtml(m.cls)}</p>
      </div>
    `).join("");
  };

  let councilFilter = "all";

  const renderCouncil = () => {
    const grid = document.getElementById("councilGrid");
    const empty = document.getElementById("councilEmpty");
    if (!grid) return;

    const filtered = councilFilter === "all"
      ? COUNCIL_MEMBERS
      : COUNCIL_MEMBERS.filter((m) => m.group === councilFilter);

    if (!filtered.length) {
      grid.innerHTML = "";
      empty?.classList.remove("d-none");
      return;
    }
    empty?.classList.add("d-none");

    grid.innerHTML = filtered.map((m, i) => `
      <div class="col-6 col-md-4 col-lg-3">
        <article class="student-card reveal reveal-delay-${i % 4}">
          <div class="student-photo" aria-hidden="true">${
            m.photo
              ? `<img src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name)}" onerror="this.parentElement.textContent = this.alt">`
              : `<span class="student-photo-fallback">${escapeHtml(initialsFor(m.name))}</span>`
          }</div>
          <p class="student-name">${escapeHtml(m.name)}</p>
          <p class="student-role">${escapeHtml(m.role)}</p>
          <p class="student-class">${escapeHtml(m.cls)}</p>
        </article>
      </div>
    `).join("");

    document.dispatchEvent(new Event("about:render"));
  };

  /* ============================================================
     BOOT
     ============================================================ */
  const initAboutPage = () => {
    const isAbout =
      document.getElementById("aboutEventsGrid") ||
      document.getElementById("aboutTimeline") ||
      document.getElementById("councilGrid");
    if (!isAbout) return;

    /* Events */
    renderAboutEvents();

    /* Timeline + toggle */
    renderTimeline();
    document.getElementById("aboutTimelineToggle")?.addEventListener("click", () => {
      timelineExpanded = !timelineExpanded;
      renderTimeline();
    });

    /* Council */
    renderCouncilFeatured();
    renderCouncil();

    /* Council filter tabs (delegated) */
    document.querySelectorAll("[data-council-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        councilFilter = btn.getAttribute("data-council-filter") || "all";
        document.querySelectorAll("[data-council-filter]").forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });
        renderCouncil();
      });
    });

    /* ---- Reusable reveal observer for dynamically-injected items ---- */
    const reobserveReveals = IEI.observeReveals;

    document.addEventListener("about:render", reobserveReveals);
    reobserveReveals();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutPage, { once: true });
  } else {
    initAboutPage();
  }
})();

/* ============================================================
   HOME PAGE — Featured projects grid + stat counters
   Activates only if #homeProjectsGrid exists.
   Consumes window.IEI_PROJECTS (shared with projects.html).
   ============================================================ */

(() => {
  "use strict";

  const IEI = window.__IEI;
  const escapeHtml = IEI.escapeHtml;
  const initialsFor = IEI.initialsFor;
  const developerName = (project) => IEI.getDeveloper(project).name;
  const developerRole = (project) => IEI.getDeveloper(project).role;

  const FEATURED_COUNT = 6;

  const renderCard = (p, i) => {
    const tags = (p.technologies || [])
      .slice(0, 3)
      .map((t) => `<li><span class="tech-tag">${escapeHtml(t)}</span></li>`)
      .join("");

    const viewUrl = `projectDetails.html?id=${encodeURIComponent(p.id)}`;
    const hireUrl = `ContactUs.html?project=${encodeURIComponent(p.id)}&source=hire`;
    const img = p.image || (p.media && p.media[0]?.src) || "";

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="home-project-card reveal reveal-delay-${i % 3}">
          <div class="home-project-media">
            ${img
              ? `<img src="${escapeHtml(img)}"
                      alt="Preview of ${escapeHtml(p.title)}"
                      loading="lazy" decoding="async">`
              : ``}
            <span class="home-project-cat">${escapeHtml(p.categoryLabel || p.category || "Project")}</span>
          </div>

          <div class="home-project-body">
            <h3 class="home-project-title">${escapeHtml(p.title)}</h3>
            <p class="home-project-desc">${escapeHtml(p.shortDescription || "")}</p>

            <ul class="home-project-tags" aria-label="Technologies used">${tags}</ul>

            <div class="home-project-dev">
              <span class="home-project-avatar" aria-hidden="true">${escapeHtml(initialsFor(developerName(p)))}</span>
              <div>
                <p class="home-project-dev-name">${escapeHtml(developerName(p))}</p>
                <p class="home-project-dev-role">${escapeHtml(developerRole(p))}</p>
              </div>
            </div>

            <div class="home-project-actions">
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
      </div>`;
  };

  const renderHomeProjects = () => {
    const grid = document.getElementById("homeProjectsGrid");
    if (!grid) return;

    const data = Array.isArray(window.IEI_PROJECTS) ? window.IEI_PROJECTS : [];

    if (!data.length) {
      grid.innerHTML = `
        <div class="col-12">
          <p class="text-muted-iei text-center mb-0">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            Featured projects will be published here soon.
          </p>
        </div>`;
      return;
    }

    const featured = data.slice(0, FEATURED_COUNT);
    grid.innerHTML = featured.map(renderCard).join("");

    // Re-observe dynamically-added reveal items
    document.dispatchEvent(new Event("home:render"));
  };

  /* ---- Animated stat counters ---- */
  const initHomeCounters = () => {
    const counters = document.querySelectorAll(".home-stat [data-count]");
    if (!counters.length) return;

    const prefersReduced = IEI.prefersReducedMotion();

    const runCounter = (el) => {
      const target = parseInt(el.getAttribute("data-count"), 10);
      if (!Number.isFinite(target)) return;

      if (prefersReduced) {
        el.textContent = String(target);
        return;
      }

      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  };

  /* ---- Local reveal observer for dynamically injected items ---- */
  const reobserveReveals = IEI.observeReveals;

  const initHomePage = () => {
    if (!document.getElementById("homeProjectsGrid")) return;

    renderHomeProjects();
    initHomeCounters();
    reobserveReveals();

    document.addEventListener("home:render", reobserveReveals);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomePage, { once: true });
  } else {
    initHomePage();
  }
})();