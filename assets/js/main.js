// تنظیم وضعیت لینک فعال
const setActiveNav = () => {
  const page = location.pathname.split("/").pop().replace(".html", "") || "index";
  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add("active");
    }
  });
};

// انیمیشن ورود
const setupReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
};

// پارالاکس لکه‌ها
const setupParallax = () => {
  const stains = document.querySelectorAll(".stain");
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    stains.forEach((stain, i) => {
      stain.style.transform = `translate(${x * (i + 1)}px, ${y * (i + 1)}px)`;
    });
  });
};

// رندر پروژه‌ها برای صفحه اصلی و پروژه‌ها
const renderProjects = () => {
  const featured = document.getElementById("featuredProjects");
  if (featured) {
    const items = PROJECTS.slice(0, 3)
      .map(
        (project) => `
        <article class="card">
          <h3>${project.title}</h3>
          <p class="meta">${project.category} · ${project.year}</p>
          <p>${project.description}</p>
          <a class="text-link" href="project.html?id=${project.id}">مطالعه موردی</a>
        </article>
      `
      )
      .join("");
    featured.innerHTML = items;
  }

  const grid = document.getElementById("projectsGrid");
  const filters = document.getElementById("projectFilters");
  if (grid && filters) {
    const categories = ["همه", ...new Set(PROJECTS.map((p) => p.category))];
    filters.innerHTML = categories
      .map(
        (cat, index) =>
          `<button class="filter-btn ${index === 0 ? "active" : ""}" data-filter="${cat}">${cat}</button>`
      )
      .join("");

    const updateGrid = (filter) => {
      const list = PROJECTS.filter((p) => filter === "همه" || p.category === filter);
      grid.innerHTML = list
        .map(
          (project) => `
          <article class="card">
            <h3>${project.title}</h3>
            <p class="meta">${project.category} · ${project.year}</p>
            <p>${project.description}</p>
            <div class="actions">
              <a class="text-link" href="project.html?id=${project.id}">جزئیات</a>
            </div>
          </article>
        `
        )
        .join("");
    };

    updateGrid("همه");

    filters.addEventListener("click", (e) => {
      if (e.target.classList.contains("filter-btn")) {
        document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        updateGrid(e.target.dataset.filter);
      }
    });
  }
};

// صفحه جزئیات پروژه
const renderProjectDetail = () => {
  const container = document.getElementById("projectDetail");
  if (!container) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || PROJECTS[0].id;
  const project = PROJECTS.find((p) => p.id === id) || PROJECTS[0];

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h1>${project.title}</h1>
        <p class="meta">${project.category} · ${project.year}</p>
      </div>
      <div class="cta-group">
        <a class="btn" href="#">Demo</a>
        <a class="btn ghost" href="#">GitHub</a>
      </div>
    </div>
    <img class="project-shot" src="assets/img/screenshot.svg" alt="اسکرین‌شات" />
    <div class="case-grid">
      <div>
        <h2>چالش</h2>
        <p>نیاز به رابطی روشن، ساده و سریع برای کاربر نهایی.</p>
      </div>
      <div>
        <h2>راه‌حل</h2>
        <p>استفاده از رنگ‌های خنثی، سیستم تایپوگرافی و اجزای سبک.</p>
      </div>
      <div>
        <h2>نتیجه</h2>
        <p>کاهش زمان انجام کار و افزایش رضایت کاربران.</p>
      </div>
    </div>
  `;
};

// رندر وبلاگ
const renderBlog = () => {
  const list = document.getElementById("blogList");
  const tagsContainer = document.getElementById("blogTags");
  const pagination = document.getElementById("blogPagination");
  if (!list) return;

  let currentTag = "همه";
  let currentPage = 1;
  const pageSize = 3;

  const tags = ["همه", ...new Set(POSTS.flatMap((post) => post.tags))];
  tagsContainer.innerHTML = tags
    .map((tag, index) => `<span class="tag ${index === 0 ? "active" : ""}" data-tag="${tag}">${tag}</span>`)
    .join("");

  const filterPosts = () => {
    const query = document.getElementById("blogSearch").value.trim().toLowerCase();
    return POSTS.filter((post) => {
      const matchesTag = currentTag === "همه" || post.tags.includes(currentTag);
      const matchesQuery = post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query);
      return matchesTag && matchesQuery;
    });
  };

  const render = () => {
    const filtered = filterPosts();
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    currentPage = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    list.innerHTML = pageItems
      .map(
        (post) => `
        <article class="card">
          <h3>${post.title}</h3>
          <p class="meta">${post.date} · ${post.tags.join(" / ")}</p>
          <p>${post.excerpt}</p>
          <a class="text-link" href="post.html?id=${post.id}">ادامه مطلب</a>
        </article>
      `
      )
      .join("");

    pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      return `<button class="page-btn ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
    }).join("");
  };

  document.getElementById("blogSearch").addEventListener("input", () => {
    currentPage = 1;
    render();
  });

  tagsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("tag")) {
      document.querySelectorAll(".tag").forEach((tag) => tag.classList.remove("active"));
      e.target.classList.add("active");
      currentTag = e.target.dataset.tag;
      currentPage = 1;
      render();
    }
  });

  pagination.addEventListener("click", (e) => {
    if (e.target.classList.contains("page-btn")) {
      currentPage = Number(e.target.dataset.page);
      render();
    }
  });

  render();
};

// پست تکی
const renderSinglePost = () => {
  const container = document.getElementById("postContent");
  if (!container) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || POSTS[0].id;
  const post = POSTS.find((p) => p.id === id) || POSTS[0];

  container.innerHTML = `
    <div class="meta">${post.date} · ${post.tags.join(" / ")}</div>
    ${post.content}
  `;

  // زمان مطالعه
  const text = container.textContent || "";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const readingTime = document.getElementById("readingTime");
  if (readingTime) {
    readingTime.textContent = `زمان مطالعه: ${minutes} دقیقه`;
  }

  // ساخت TOC
  const toc = document.getElementById("toc");
  if (toc) {
    const headings = container.querySelectorAll("h2, h3");
    toc.innerHTML = "<strong>فهرست</strong>";
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;
      const item = document.createElement("a");
      item.className = "toc-item";
      item.href = `#${id}`;
      item.textContent = heading.textContent;
      toc.appendChild(item);
    });
  }
};

// فرم تماس
const setupContactForm = () => {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const msg = document.getElementById("formMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      msg.textContent = "لطفاً همه فیلدها را کامل کنید.";
      return;
    }
    msg.textContent = "پیام شما با موفقیت ثبت شد.";
    form.reset();
  });
};

// Command Palette
const setupPalette = () => {
  const palette = document.getElementById("palette");
  const input = document.getElementById("paletteInput");
  const list = document.getElementById("paletteList");
  const openBtn = document.getElementById("openPalette");
  if (!palette || !input || !list) return;

  const actions = [
    { label: "خانه", url: "index.html" },
    { label: "درباره", url: "about.html" },
    { label: "پروژه‌ها", url: "projects.html" },
    { label: "وبلاگ", url: "blog.html" },
    { label: "تماس", url: "contact.html" },
    ...PROJECTS.map((p) => ({ label: `پروژه: ${p.title}`, url: `project.html?id=${p.id}` })),
  ];

  const render = (query = "") => {
    const filtered = actions.filter((item) => item.label.includes(query));
    list.innerHTML = filtered
      .map((item) => `<div class="palette-item" data-url="${item.url}">${item.label}</div>`)
      .join("") || "<p class='muted'>نتیجه‌ای یافت نشد.</p>";
  };

  const openPalette = () => {
    palette.classList.add("show");
    palette.setAttribute("aria-hidden", "false");
    input.value = "";
    render();
    input.focus();
  };

  const closePalette = () => {
    palette.classList.remove("show");
    palette.setAttribute("aria-hidden", "true");
  };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    }
    if (e.key === "Escape") {
      closePalette();
    }
  });

  openBtn?.addEventListener("click", openPalette);
  palette.addEventListener("click", (e) => {
    if (e.target === palette) closePalette();
  });
  input.addEventListener("input", (e) => render(e.target.value));
  list.addEventListener("click", (e) => {
    const target = e.target.closest(".palette-item");
    if (target) {
      location.href = target.dataset.url;
    }
  });
};

// پست‌های آخر در خانه
const renderLatestPosts = () => {
  const latest = document.getElementById("latestPosts");
  if (!latest) return;
  latest.innerHTML = POSTS.slice(0, 3)
    .map(
      (post) => `
      <article class="card">
        <h3>${post.title}</h3>
        <p class="meta">${post.date} · ${post.tags.join(" / ")}</p>
        <p>${post.excerpt}</p>
        <a class="text-link" href="post.html?id=${post.id}">ادامه مطلب</a>
      </article>
    `
    )
    .join("");
};

// اجرای کلی
setActiveNav();
setupReveal();
setupParallax();
renderProjects();
renderProjectDetail();
renderBlog();
renderSinglePost();
setupContactForm();
setupPalette();
renderLatestPosts();
