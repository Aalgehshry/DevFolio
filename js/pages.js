/**
 * DevFolio — detail pages
 * -----------------------------------------------------------------------------
 * `portfolio-details.html` and `blog-single.html` are each a single template
 * filled from the tables below, selected by a query string:
 *
 *     portfolio-details.html?project=3
 *     blog-single.html?post=2
 *
 * One file per project would mean six near-identical documents to keep in
 * sync. Placeholders in the markup are marked with `data-project="…"` /
 * `data-post="…"` and filled in here. An unknown or missing id falls back to
 * the first entry, so a bare URL still renders a complete page.
 */
(function () {
  "use strict";

  /* ==========================================================================
     Content
     ========================================================================== */

  const PROJECTS = [
    {
      title: "Lorem impsum dolor",
      category: "Web Design",
      client: "Acme Studio",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "A marketing site rebuilt around a single flexible layout, so the team " +
        "could publish new campaign pages without touching a line of CSS.",
      images: ["images04", "images05", "images06"],
    },
    {
      title: "Loreda Cuno Nere",
      category: "Web Design",
      client: "Nere Group",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "A brand refresh delivered as a small design system: tokens, six " +
        "components and a documentation page the client maintains themselves.",
      images: ["images05", "images07", "images08"],
    },
    {
      title: "Mavrito Lana Dere",
      category: "Web Design",
      client: "Mavrito",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "An editorial layout tuned for long-form reading, with typography that " +
        "holds up from a 320px phone to a 4K display.",
      images: ["images06", "images09", "images04"],
    },
    {
      title: "Bindo Laro Cado",
      category: "Web Design",
      client: "Bindo",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "A booking flow reduced from nine steps to four, cutting drop-off by " +
        "more than a third in the first month after launch.",
      images: ["images07", "images08", "images05"],
    },
    {
      title: "Studio Lena Mado",
      category: "Web Design",
      client: "Studio Lena",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "A portfolio for a photography studio where the images carry the page " +
        "and the interface stays out of the way.",
      images: ["images08", "images04", "images09"],
    },
    {
      title: "Studio Big Bang",
      category: "Web Design",
      client: "Big Bang",
      date: "18 Sep. 2017",
      url: "example.com",
      summary:
        "A product landing page built to load fast on a mid-range phone over " +
        "3G, without giving up the full-bleed imagery the brand relies on.",
      images: ["images09", "images06", "images07"],
    },
  ];

  const POSTS = [
    {
      title: "See more ideas about Travel",
      category: "Travel",
      date: "18 Sep. 2018",
      datetime: "2018-09-18",
      image: "images12",
      summary:
        "Notes from a month of working from six different cities, and what it " +
        "taught me about designing for screens I do not own.",
    },
    {
      title: "Design systems that scale",
      category: "Web Design",
      date: "24 Oct. 2018",
      datetime: "2018-10-24",
      image: "images13",
      summary:
        "A design system earns its keep the day someone other than its author " +
        "ships a feature with it. Here is how to get to that day sooner.",
    },
    {
      title: "Shipping accessible interfaces",
      category: "Web Design",
      date: "07 Dec. 2018",
      datetime: "2018-12-07",
      image: "images14",
      summary:
        "Accessibility is not a phase at the end of the project. These are the " +
        "checks that are cheap during the build and expensive afterwards.",
    },
  ];

  /* ==========================================================================
     Helpers
     ========================================================================== */

  const selectAll = (selector) => Array.from(document.querySelectorAll(selector));

  /** Reads a 1-based id from the query string and clamps it to `length`. */
  const indexFromQuery = (param, length) => {
    const raw = new URLSearchParams(window.location.search).get(param);
    const index = Number.parseInt(raw, 10) - 1;
    return Number.isInteger(index) && index >= 0 && index < length ? index : 0;
  };

  /** Writes `value` into every `[data-<attr>="<key>"]` placeholder. */
  const fill = (attr, key, value) => {
    selectAll(`[data-${attr}="${key}"]`).forEach((element) => {
      element.textContent = value;
    });
  };

  /**
   * Builds a <picture> serving WebP with a JPEG fallback. `stem` is the file
   * name without an extension, e.g. "images04".
   */
  const pictureMarkup = (stem, alt, width, height, className = "img-fluid") => {
    // images11 is the one JPEG in the folder saved with a .jpeg extension.
    const fallback = stem === "images11" ? "jpeg" : "jpg";
    return [
      "<picture>",
      `<source srcset="images/${stem}.webp" type="image/webp">`,
      `<img src="images/${stem}.${fallback}" class="${className}"`,
      ` width="${width}" height="${height}" loading="lazy" decoding="async"`,
      ` alt="${alt}">`,
      "</picture>",
    ].join("");
  };

  /* ==========================================================================
     portfolio-details.html
     ========================================================================== */

  function initProjectPage() {
    const slider = document.querySelector('[data-project="slides"]');
    if (!slider) return;

    const index = indexFromQuery("project", PROJECTS.length);
    const project = PROJECTS[index];

    document.title = `${project.title} — DevFolio`;

    fill("project", "title", project.title);
    fill("project", "category", project.category);
    fill("project", "client", project.client);
    fill("project", "date", project.date);

    const link = document.querySelector('[data-project="url"]');
    if (link) {
      link.textContent = project.url;
      link.href = `https://${project.url}`;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
    }

    fill("project", "summary", project.summary);

    slider.innerHTML = project.images
      .map(
        (stem, slide) =>
          `<div class="carousel-item${slide === 0 ? " active" : ""}">` +
          pictureMarkup(
            stem,
            `${project.title} — screenshot ${slide + 1}`,
            960,
            600,
            "d-block w-100"
          ) +
          "</div>"
      )
      .join("");

    // Wrap around at both ends so neither button is ever a dead link.
    const prev = (index - 1 + PROJECTS.length) % PROJECTS.length;
    const next = (index + 1) % PROJECTS.length;
    setHref('[data-project="prev"]', `portfolio-details.html?project=${prev + 1}`);
    setHref('[data-project="next"]', `portfolio-details.html?project=${next + 1}`);
  }

  function setHref(selector, href) {
    const element = document.querySelector(selector);
    if (element) element.href = href;
  }

  /* ==========================================================================
     blog-single.html
     ========================================================================== */

  function initPostPage() {
    const imageSlot = document.querySelector('[data-post="image"]');
    if (!imageSlot) return;

    const index = indexFromQuery("post", POSTS.length);
    const post = POSTS[index];

    document.title = `${post.title} — DevFolio`;

    fill("post", "title", post.title);
    fill("post", "category", post.category);
    fill("post", "date", post.date);
    fill("post", "summary", post.summary);

    selectAll('[data-post="datetime"]').forEach((element) => {
      element.setAttribute("datetime", post.datetime);
    });

    imageSlot.innerHTML = pictureMarkup(post.image, "", 1000, 666, "img-fluid rounded");

    const related = document.querySelector('[data-post="related"]');
    if (related) {
      related.innerHTML = POSTS.map((entry, entryIndex) =>
        entryIndex === index
          ? ""
          : `<li><a href="blog-single.html?post=${entryIndex + 1}">${entry.title}</a></li>`
      ).join("");
    }
  }

  /* ==========================================================================
     Bootstrap
     ========================================================================== */

  function init() {
    initProjectPage();
    initPostPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
