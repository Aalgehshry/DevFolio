/**
 * DevFolio — site behaviour
 * -----------------------------------------------------------------------------
 * Vanilla JS, no build step. Each concern lives in its own `init*` function and
 * every one of them exits early when the markup it drives is not on the page,
 * so this file can be shared by index.html and the inner pages.
 *
 * Everything degrades gracefully: with JS disabled the page is still readable,
 * navigable and the contact form still submits to its `action`.
 */
(function () {
  "use strict";

  /* ==========================================================================
     Small helpers
     ========================================================================== */

  /** @type {(selector: string, scope?: ParentNode) => Element|null} */
  const select = (selector, scope = document) => scope.querySelector(selector);

  /** @type {(selector: string, scope?: ParentNode) => Element[]} */
  const selectAll = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const on = (target, event, handler, options) => {
    if (target) target.addEventListener(event, handler, options);
  };

  /** Runs `callback` at most once per animation frame. */
  const onAnimationFrame = (callback) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        callback(...args);
      });
    };
  };

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Observes elements once and calls `callback(element)` the first time each
   * one enters the viewport. Falls back to running immediately when
   * IntersectionObserver is unavailable.
   */
  const observeOnce = (elements, callback, options = { threshold: 0.25 }) => {
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach(callback);
      return;
    }

    const observer = new IntersectionObserver((entries, self) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        callback(entry.target);
        self.unobserve(entry.target);
      });
    }, options);

    elements.forEach((element) => observer.observe(element));
  };

  /* ==========================================================================
     Preloader
     ========================================================================== */

  function initPreloader() {
    const preloader = select("#preloader");
    if (!preloader) return;

    const hide = () => {
      preloader.classList.add("is-hidden");
      // Remove it from the accessibility tree once the fade-out is done.
      window.setTimeout(() => preloader.remove(), 400);
    };

    if (document.readyState === "complete") hide();
    else on(window, "load", hide);

    // Safety net: never trap the page behind the loader if an asset hangs.
    window.setTimeout(hide, 5000);
  }

  /* ==========================================================================
     Colour theme (light / dark)
     ========================================================================== */

  const THEME_STORAGE_KEY = "devfolio-theme";

  function initThemeToggle() {
    const toggle = select("#theme-toggle");
    const root = document.documentElement;

    const applyTheme = (theme) => {
      root.setAttribute("data-bs-theme", theme);
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(theme === "dark"));
        toggle.setAttribute(
          "aria-label",
          theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
        );
      }
    };

    const storedTheme = readStoredTheme();
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    applyTheme(storedTheme || (systemPrefersDark ? "dark" : "light"));

    on(toggle, "click", () => {
      const next =
        root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      writeStoredTheme(next);
    });

    // Follow the OS until the visitor makes an explicit choice.
    on(window.matchMedia("(prefers-color-scheme: dark)"), "change", (event) => {
      if (readStoredTheme()) return;
      applyTheme(event.matches ? "dark" : "light");
    });
  }

  // localStorage throws in private-mode Safari and when cookies are blocked.
  function readStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      /* storage unavailable — the choice simply won't persist */
    }
  }

  /* ==========================================================================
     Header: shrink on scroll
     ========================================================================== */

  function initStickyHeader() {
    const header = select("#header");
    if (!header) return;

    const update = () => {
      header.classList.toggle("header-scrolled", window.scrollY > 100);
    };

    update();
    on(window, "scroll", onAnimationFrame(update), { passive: true });
  }

  /* ==========================================================================
     Mobile navigation
     ========================================================================== */

  function initMobileNav() {
    const navbar = select("#navbar");
    const toggle = select(".mobile-nav-toggle");
    if (!navbar || !toggle) return;

    const setOpen = (open) => {
      navbar.classList.toggle("navbar-mobile", open);
      document.body.classList.toggle("mobile-nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.classList.toggle("fa-bars", !open);
      toggle.classList.toggle("fa-xmark", open);
    };

    const close = () => setOpen(false);

    on(toggle, "click", () => {
      setOpen(!navbar.classList.contains("navbar-mobile"));
    });

    // Inside the mobile menu, a parent link opens its sub-menu instead of
    // navigating — on touch there is no hover to reveal it.
    selectAll(".dropdown > a", navbar).forEach((link) => {
      on(link, "click", (event) => {
        if (!navbar.classList.contains("navbar-mobile")) return;
        event.preventDefault();
        const submenu = link.nextElementSibling;
        if (submenu) submenu.classList.toggle("dropdown-active");
      });
    });

    // Any real navigation closes the menu.
    selectAll(".scrollto", navbar).forEach((link) => on(link, "click", close));

    on(document, "keydown", (event) => {
      if (event.key === "Escape") close();
    });

    // Leaving the mobile breakpoint must not strand the page in menu state.
    on(window.matchMedia("(min-width: 992px)"), "change", (event) => {
      if (event.matches) close();
    });
  }

  /* ==========================================================================
     Smooth scrolling with a sticky-header offset
     ========================================================================== */

  function headerOffset() {
    const header = select("#header");
    return header ? header.offsetHeight : 0;
  }

  function scrollToSection(target) {
    const top =
      target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function initSmoothScroll() {
    selectAll(".scrollto, .hero-scroll-cue").forEach((link) => {
      on(link, "click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || !hash.startsWith("#") || hash === "#") return;

        const target = select(hash);
        if (!target) return;

        event.preventDefault();
        scrollToSection(target);

        // Keep the URL and keyboard focus in sync with the visual position.
        history.pushState(null, "", hash);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });

    // Honour a deep link such as /#work on first load.
    on(window, "load", () => {
      if (!window.location.hash) return;
      const target = select(window.location.hash);
      if (target) window.setTimeout(() => scrollToSection(target), 100);
    });
  }

  /* ==========================================================================
     Scrollspy: highlight the section currently in view
     ========================================================================== */

  function initScrollspy() {
    const links = selectAll("#navbar .scrollto").filter((link) =>
      (link.getAttribute("href") || "").startsWith("#")
    );
    if (!links.length) return;

    const sections = links
      .map((link) => ({ link, section: select(link.getAttribute("href")) }))
      .filter((entry) => entry.section);

    const update = () => {
      const position = window.scrollY + headerOffset() + 20;

      let current = sections[0];
      sections.forEach((entry) => {
        if (entry.section.offsetTop <= position) current = entry;
      });

      // Bottom of the page: the last section is the one being read.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 2;
      if (atBottom) current = sections[sections.length - 1];

      sections.forEach(({ link }) => {
        const isActive = link === current.link;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    update();
    on(window, "scroll", onAnimationFrame(update), { passive: true });
    on(window, "resize", onAnimationFrame(update));
  }

  /* ==========================================================================
     Back to top
     ========================================================================== */

  function initBackToTop() {
    const button = select(".back-to-top");
    if (!button) return;

    const update = () => {
      button.classList.toggle("active", window.scrollY > 300);
    };

    update();
    on(window, "scroll", onAnimationFrame(update), { passive: true });

    on(button, "click", (event) => {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
  }

  /* ==========================================================================
     Counters
     ========================================================================== */

  function initCounters() {
    const counters = selectAll(".purecounter");
    if (!counters.length) return;

    counters.forEach((counter) => {
      const start = Number(counter.dataset.purecounterStart || 0);
      counter.textContent = String(start);
    });

    observeOnce(counters, animateCounter, { threshold: 0.4 });
  }

  function animateCounter(counter) {
    const start = Number(counter.dataset.purecounterStart || 0);
    const end = Number(counter.dataset.purecounterEnd || 0);
    const duration = Number(counter.dataset.purecounterDuration || 1) * 1000;

    if (prefersReducedMotion() || duration <= 0) {
      counter.textContent = String(end);
      return;
    }

    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      // easeOutQuad — fast at first, settles gently on the final number.
      const eased = 1 - (1 - progress) * (1 - progress);
      counter.textContent = String(Math.round(start + (end - start) * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }

  /* ==========================================================================
     Skill bars
     ========================================================================== */

  function initSkillBars() {
    const bars = selectAll(".skill-mf .progress-bar");
    if (!bars.length) return;

    // The final width lives in the inline style so the bars are still correct
    // without JS; stash it, collapse the bar, then grow it back on scroll.
    bars.forEach((bar) => {
      bar.dataset.targetWidth = bar.style.width || "0%";
      if (!prefersReducedMotion()) bar.style.width = "0%";
    });

    observeOnce(
      bars,
      (bar) => {
        bar.style.width = bar.dataset.targetWidth;
      },
      { threshold: 0.3 }
    );
  }

  /* ==========================================================================
     Scroll reveal
     ========================================================================== */

  function initScrollReveal() {
    const elements = selectAll("[data-reveal]");
    if (!elements.length) return;

    // Stagger siblings so grids cascade instead of popping in together.
    const groups = new Map();
    elements.forEach((element) => {
      const parent = element.parentElement;
      const index = groups.get(parent) || 0;
      groups.set(parent, index + 1);
      element.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 90}ms`);
    });

    observeOnce(
      elements,
      (element) => element.classList.add("is-revealed"),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
  }

  /* ==========================================================================
     Portfolio lightbox
     ========================================================================== */

  function initLightbox() {
    const triggers = selectAll("a.portfolio-lightbox");
    if (!triggers.length) return;

    const items = triggers.map((trigger) => ({
      src: trigger.getAttribute("href"),
      alt: select("img", trigger)?.getAttribute("alt") || "",
    }));

    const lightbox = buildLightbox();
    document.body.appendChild(lightbox.root);

    let index = 0;
    let lastFocused = null;

    const render = () => {
      lightbox.image.src = items[index].src;
      lightbox.image.alt = items[index].alt;
      lightbox.counter.textContent = `${index + 1} / ${items.length}`;
    };

    const open = (startIndex) => {
      lastFocused = document.activeElement;
      index = startIndex;
      render();
      lightbox.root.classList.add("is-open");
      lightbox.root.setAttribute("aria-hidden", "false");
      document.body.classList.add("mobile-nav-open"); // reuse the scroll lock
      lightbox.closeButton.focus();
    };

    const close = () => {
      lightbox.root.classList.remove("is-open");
      lightbox.root.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-nav-open");
      if (lastFocused instanceof HTMLElement) lastFocused.focus();
    };

    const step = (delta) => {
      index = (index + delta + items.length) % items.length;
      render();
    };

    triggers.forEach((trigger, triggerIndex) => {
      on(trigger, "click", (event) => {
        event.preventDefault();
        open(triggerIndex);
      });
    });

    on(lightbox.closeButton, "click", close);
    on(lightbox.prevButton, "click", () => step(-1));
    on(lightbox.nextButton, "click", () => step(1));

    // Clicking the backdrop (but not the image itself) closes.
    on(lightbox.root, "click", (event) => {
      if (event.target === lightbox.root) close();
    });

    on(document, "keydown", (event) => {
      if (!lightbox.root.classList.contains("is-open")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
  }

  function buildLightbox() {
    const root = document.createElement("div");
    root.className = "lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Portfolio image viewer");
    root.setAttribute("aria-hidden", "true");

    root.innerHTML = [
      '<button type="button" class="lightbox__btn lightbox__btn--close" aria-label="Close viewer"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>',
      '<button type="button" class="lightbox__btn lightbox__btn--prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>',
      '<img class="lightbox__image" src="" alt="">',
      '<button type="button" class="lightbox__btn lightbox__btn--next" aria-label="Next image"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>',
      '<p class="lightbox__counter"></p>',
    ].join("");

    return {
      root,
      image: select(".lightbox__image", root),
      counter: select(".lightbox__counter", root),
      closeButton: select(".lightbox__btn--close", root),
      prevButton: select(".lightbox__btn--prev", root),
      nextButton: select(".lightbox__btn--next", root),
    };
  }

  /* ==========================================================================
     Contact form
     --------------------------------------------------------------------------
     The template ships a PHP handler, but GitHub Pages serves static files
     only — posting there returns a 404. So the form is validated in the
     browser and handed to the visitor's mail client via a `mailto:` link.
     Point `data-endpoint` at a real form service (Formspree, Basin, a
     serverless function…) to send it over the network instead.
     ========================================================================== */

  const CONTACT_EMAIL = "contact@example.com";

  function initContactForm() {
    const form = select(".php-email-form");
    if (!form) return;

    const loading = select(".loading", form);
    const errorMessage = select(".error-message", form);
    const sentMessage = select(".sent-message", form);
    const submitButton = select('button[type="submit"]', form);
    const fields = selectAll(".form-control", form);

    const show = (element, text) => {
      if (!element) return;
      if (text !== undefined) element.textContent = text;
      element.style.display = "block";
    };

    const hideAllMessages = () => {
      [loading, errorMessage, sentMessage].forEach((element) => {
        if (element) element.style.display = "none";
      });
    };

    // Validate on blur, then live once the field has been touched — never
    // shout at someone who is still typing their first character.
    fields.forEach((field) => {
      on(field, "blur", () => {
        field.dataset.touched = "true";
        validateField(field);
      });
      on(field, "input", () => {
        if (field.dataset.touched === "true") validateField(field);
      });
    });

    on(form, "submit", (event) => {
      event.preventDefault();
      hideAllMessages();

      const invalidFields = fields.filter((field) => {
        field.dataset.touched = "true";
        return !validateField(field);
      });

      if (invalidFields.length) {
        show(errorMessage, "Please correct the highlighted fields.");
        invalidFields[0].focus();
        return;
      }

      show(loading);
      if (submitButton) submitButton.disabled = true;

      const data = Object.fromEntries(new FormData(form).entries());
      const endpoint = form.dataset.endpoint;

      const finish = (ok) => {
        hideAllMessages();
        if (submitButton) submitButton.disabled = false;
        if (ok) {
          show(
            sentMessage,
            endpoint
              ? "Thanks! Your message has been sent."
              : "Your email app is opening with the message ready to send."
          );
          form.reset();
          fields.forEach((field) => {
            delete field.dataset.touched;
            clearFieldError(field);
          });
        } else {
          show(
            errorMessage,
            `Sorry, the message could not be sent. Please email ${CONTACT_EMAIL} directly.`
          );
        }
      };

      if (endpoint) {
        sendToEndpoint(endpoint, data).then(finish);
      } else {
        window.location.href = buildMailtoLink(data);
        window.setTimeout(() => finish(true), 600);
      }
    });
  }

  function sendToEndpoint(endpoint, data) {
    return fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams(data),
    })
      .then((response) => response.ok)
      .catch(() => false);
  }

  function buildMailtoLink(data) {
    const subject = data.subject || "Message from your portfolio";
    const body = [
      `Name: ${data.name || ""}`,
      `Email: ${data.email || ""}`,
      "",
      data.message || "",
    ].join("\n");

    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  function validateField(field) {
    const value = field.value.trim();
    let message = "";

    if (!value) {
      message = "This field is required.";
    } else if (field.type === "email" && !isValidEmail(value)) {
      message = "Please enter a valid email address.";
    } else if (field.tagName === "TEXTAREA" && value.length < 10) {
      message = "Please write at least 10 characters.";
    }

    if (message) {
      setFieldError(field, message);
      return false;
    }

    clearFieldError(field);
    return true;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function fieldErrorElement(field) {
    const group = field.closest(".form-group") || field.parentElement;
    let element = select(".field-error", group);

    if (!element) {
      element = document.createElement("span");
      element.className = "field-error";
      element.setAttribute("role", "alert");
      group.appendChild(element);
    }

    return element;
  }

  function setFieldError(field, message) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    fieldErrorElement(field).textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    fieldErrorElement(field).textContent = "";
  }

  /* ==========================================================================
     Hero typing effect (typed.js, loaded from a CDN)
     ========================================================================== */

  function initTypedHeadline() {
    const element = select("#element");
    if (!element) return;

    const roles = ["Designer", "Developer", "Freelancer", "Photographer"];

    // The CDN can be blocked or slow — show something readable regardless.
    if (typeof window.Typed !== "function") {
      element.textContent = roles[0];
      return;
    }

    if (prefersReducedMotion()) {
      element.textContent = roles.join(" · ");
      return;
    }

    new window.Typed("#element", {
      strings: roles,
      typeSpeed: 50,
      backSpeed: 50,
      loop: true,
      loopCount: Infinity,
    });
  }

  /* ==========================================================================
     Bootstrap
     ========================================================================== */

  function init() {
    document.documentElement.classList.remove("no-js");

    initPreloader();
    initThemeToggle();
    initStickyHeader();
    initMobileNav();
    initSmoothScroll();
    initScrollspy();
    initBackToTop();
    initCounters();
    initSkillBars();
    initScrollReveal();
    initLightbox();
    initContactForm();
    initTypedHeadline();
  }

  if (document.readyState === "loading") {
    on(document, "DOMContentLoaded", init);
  } else {
    init();
  }
})();
