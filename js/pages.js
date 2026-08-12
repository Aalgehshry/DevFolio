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
      title: "Campaign landing page",
      category: "Web Design",
      client: "Personal project",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "My first real attempt at translating a finished design faithfully rather " +
        "than approximating it. It taught me to read a mock for spacing and type " +
        "scale, not just for colour.",
      images: ["images04", "images05", "images06"],
    },
    {
      title: "Responsive photo grid",
      category: "Web Design",
      client: "Personal project",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "A gallery built with CSS Grid and no media queries at all — the columns " +
        "come from auto-fit and minmax. It still surprises me how little code that " +
        "takes.",
      images: ["images05", "images07", "images08"],
    },
    {
      title: "Long-form article template",
      category: "Web Design",
      client: "Personal project",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "An exercise in typography: line length, vertical rhythm and heading " +
        "hierarchy, tested by actually reading a long article on a phone instead of " +
        "eyeballing it on a laptop.",
      images: ["images06", "images09", "images04"],
    },
    {
      title: "Multi-step booking form",
      category: "Web Design",
      client: "Personal project",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "Four steps, validation on each one, and real states for empty, loading and " +
        "error. The happy path took an afternoon; everything else took a week.",
      images: ["images07", "images08", "images05"],
    },
    {
      title: "Studio portfolio layout",
      category: "Web Design",
      client: "Personal project",
      date: "18 Sep. 2018",
      url: "example.com",
      summary:
        "A layout where the photographs carry the page and the interface stays out " +
        "of the way. Mostly a lesson in restraint, and in how much whitespace a " +
        "design can take.",
      images: ["images08", "images04", "images09"],
    },
    {
      title: "Product page performance pass",
      category: "Web Design",
      client: "Personal project",
      date: "18 Sep. 2017",
      url: "example.com",
      summary:
        "The same page rebuilt to load quickly on a mid-range phone: compressed " +
        "images, WebP with a fallback, and nothing fetched that the first screen " +
        "does not need.",
      images: ["images09", "images06", "images07"],
    },
  ];

  const POSTS = [
    {
      title: "What travelling taught me about small screens",
      category: "Travel",
      date: "18 Sep. 2018",
      datetime: "2018-09-18",
      image: "images12",
      summary:
        "A month of working from six different cities, and what unreliable hotel " +
        "wi-fi taught me about building for screens and connections I do not control.",
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
