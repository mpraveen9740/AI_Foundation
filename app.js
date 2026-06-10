/**
 * AetherMind Blog Application Logic
 * Implements client-side routing, search, filtering, theme toggle, and form handling.
 */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// App State
const state = {
  currentRoute: "home",
  activeCategory: "all",
  searchQuery: "",
  theme: "dark"
};

/**
 * Initialize application-wide event listeners and state
 */
function initApp() {
  initTheme();
  initRouter();
  initGlobalEvents();
}

/* ==================== THEME MANAGEMENT ==================== */

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  // Read saved theme or fallback to user preferences
  const savedTheme = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  
  if (savedTheme === "light" || (!savedTheme && prefersLight)) {
    state.theme = "light";
    document.body.classList.add("light-theme");
  } else {
    state.theme = "dark";
    document.body.classList.remove("light-theme");
  }

  toggleBtn.addEventListener("click", () => {
    if (state.theme === "dark") {
      state.theme = "light";
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      state.theme = "dark";
      document.body.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  });
}

/* ==================== ROUTING SYSTEM ==================== */

function initRouter() {
  // Listen for hash changes
  window.addEventListener("hashchange", handleRouting);
  
  // Handle initial page load
  handleRouting();
}

function handleRouting() {
  const hash = window.location.hash || "#home";
  
  // Close mobile navigation menu on route change
  const navMenu = document.getElementById("nav-menu");
  if (navMenu) navMenu.classList.remove("open");

  // Parse Route e.g. #post/agentic-ai or #category/AI
  const pathParts = hash.split("/");
  const route = pathParts[0]; // e.g. "#home", "#blog", "#post", "#category"
  const parameter = pathParts.slice(1).join("/"); // e.g. "agentic-ai", "AI" (decoded below)

  // Update navbar links active highlight
  updateActiveNavLink(route);

  // Scroll to top of page on route change
  window.scrollTo({ top: 0, behavior: "instant" });

  // Render view depending on the parsed route
  if (route === "#home") {
    renderHomeView();
  } else if (route === "#blog") {
    state.activeCategory = "all";
    state.searchQuery = "";
    renderBlogView();
  } else if (route === "#about") {
    renderAboutView();
  } else if (route === "#contact") {
    renderContactView();
  } else if (route === "#category") {
    const decodedCategory = decodeURIComponent(parameter);
    state.activeCategory = decodedCategory;
    state.searchQuery = "";
    renderBlogView();
  } else if (route === "#post") {
    renderPostDetailView(parameter);
  } else {
    // Fallback/Redirect to Home
    window.location.hash = "#home";
  }
}

/**
 * Updates navbar active indicator depending on the current primary route
 */
function updateActiveNavLink(primaryRoute) {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === primaryRoute || (primaryRoute === "#category" && href === "#blog")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Clones a template tag by ID and mounts it to the main content container
 */
function mountTemplate(templateId) {
  const appContent = document.getElementById("app-content");
  const template = document.getElementById(templateId);
  
  if (!appContent || !template) {
    console.error(`Missing layout element: #${templateId} or #app-content`);
    return null;
  }
  
  appContent.innerHTML = "";
  const clone = template.content.cloneNode(true);
  appContent.appendChild(clone);
  return appContent;
}

/* ==================== HOME VIEW ==================== */

function renderHomeView() {
  mountTemplate("template-home");

  const featuredContainer = document.getElementById("home-featured-container");
  const recentContainer = document.getElementById("home-recent-container");
  
  const posts = window.blogPosts || [];

  // 1. Featured Posts (filter by featured: true, limit to 2)
  if (featuredContainer) {
    const featuredPosts = posts.filter(p => p.featured).slice(0, 2);
    featuredContainer.innerHTML = featuredPosts.map(p => createPostCardHTML(p)).join("");
  }

  // 2. Recent Posts (limit to 3, excluding featured if possible, or just the remainder)
  if (recentContainer) {
    const recentPosts = posts.filter(p => !p.featured).slice(0, 3);
    // Fallback to general posts if no non-featured items exist
    const itemsToRender = recentPosts.length > 0 ? recentPosts : posts.slice(0, 3);
    recentContainer.innerHTML = itemsToRender.map(p => createPostCardHTML(p)).join("");
  }

  // 3. Category cards navigation click events
  const categoryCards = document.querySelectorAll(".category-card");
  categoryCards.forEach(card => {
    card.addEventListener("click", () => {
      const category = card.getAttribute("data-category");
      window.location.hash = `#category/${encodeURIComponent(category)}`;
    });
  });
}

/* ==================== BLOG VIEW (SEARCH & FILTERS) ==================== */

function renderBlogView() {
  mountTemplate("template-blog");

  const searchInput = document.getElementById("blog-search-input");
  const filterBadgesContainer = document.getElementById("blog-filter-badges");
  
  if (searchInput) {
    searchInput.value = state.searchQuery;
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      filterAndRenderBlogPosts();
    });
    // Set focus on desktop
    if (window.innerWidth > 768) {
      searchInput.focus();
    }
  }

  // Setup click listeners for filter badges
  if (filterBadgesContainer) {
    const badges = filterBadgesContainer.querySelectorAll(".filter-badge");
    badges.forEach(badge => {
      const cat = badge.getAttribute("data-category");
      
      // Sync active state UI from router category
      if (cat === state.activeCategory) {
        badge.classList.add("active");
      } else {
        badge.classList.remove("active");
      }

      badge.addEventListener("click", () => {
        badges.forEach(b => b.classList.remove("active"));
        badge.classList.add("active");
        
        state.activeCategory = cat;
        filterAndRenderBlogPosts();
        
        // Sync URL hash state if user changes categories manually
        if (cat === "all") {
          window.history.pushState(null, "", "#blog");
          updateActiveNavLink("#blog");
        } else {
          window.history.pushState(null, "", `#category/${encodeURIComponent(cat)}`);
          updateActiveNavLink("#blog");
        }
      });
    });
  }

  // Initial render of posts
  filterAndRenderBlogPosts();
}

/**
 * Filter blogPosts array based on state criteria, and paint cards
 */
function filterAndRenderBlogPosts() {
  const postsGrid = document.getElementById("blog-posts-grid");
  const countLabel = document.getElementById("blog-results-count");
  if (!postsGrid) return;

  const query = state.searchQuery.toLowerCase().trim();
  const cat = state.activeCategory;
  
  const allPosts = window.blogPosts || [];

  const filtered = allPosts.filter(post => {
    // Category match check
    const matchesCategory = (cat === "all" || post.category.toLowerCase() === cat.toLowerCase());
    
    // Keyword search match check
    const matchesSearch = !query || 
      post.title.toLowerCase().includes(query) || 
      post.excerpt.toLowerCase().includes(query) || 
      post.content.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  // Render count label
  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} article${filtered.length === 1 ? "" : "s"}`;
  }

  if (filtered.length === 0) {
    postsGrid.innerHTML = `
      <div class="no-results glass">
        <div class="no-results-icon">🔍</div>
        <h3>No matching posts found</h3>
        <p>Try refining your query, checking spelling, or selecting another category.</p>
      </div>
    `;
  } else {
    postsGrid.innerHTML = filtered.map(p => createPostCardHTML(p)).join("");
  }
}

/* ==================== POST DETAIL VIEW ==================== */

function renderPostDetailView(postId) {
  mountTemplate("template-post-detail");

  const posts = window.blogPosts || [];
  const post = posts.find(p => p.id === postId);

  if (!post) {
    const container = document.querySelector(".post-detail-container");
    if (container) {
      container.innerHTML = `
        <div class="no-results glass" style="margin-top: 4rem;">
          <div class="no-results-icon">⚠️</div>
          <h3>Article Not Found</h3>
          <p>The post you are trying to view does not exist or has been moved.</p>
          <a href="#blog" class="btn btn-primary" style="margin-top: 1.5rem;">Return to Directory</a>
        </div>
      `;
    }
    return;
  }

  // Populate data fields
  document.getElementById("post-detail-category").textContent = post.category;
  document.getElementById("post-detail-title").textContent = post.title;
  document.getElementById("post-detail-avatar").textContent = post.author.avatar;
  document.getElementById("post-detail-author-name").textContent = post.author.name;
  document.getElementById("post-detail-author-role").textContent = post.author.role;
  document.getElementById("post-detail-date").textContent = post.date;
  document.getElementById("post-detail-readtime").textContent = post.readTime;
  
  const coverImg = document.getElementById("post-detail-cover");
  coverImg.src = post.image;
  coverImg.alt = post.title;

  document.getElementById("post-detail-body").innerHTML = post.content;

  // Bind Share Buttons
  const currentUrl = window.location.href;
  
  document.getElementById("share-btn-twitter").addEventListener("click", () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  });

  document.getElementById("share-btn-linkedin").addEventListener("click", () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  });

  const copyBtn = document.getElementById("share-btn-copy");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      const originalSvg = copyBtn.innerHTML;
      copyBtn.innerHTML = `✓`;
      copyBtn.style.color = "var(--success-color)";
      copyBtn.style.borderColor = "var(--success-color)";
      setTimeout(() => {
        copyBtn.innerHTML = originalSvg;
        copyBtn.style.color = "";
        copyBtn.style.borderColor = "";
      }, 2000);
    });
  });
}

/* ==================== ABOUT & CONTACT VIEWS ==================== */

function renderAboutView() {
  mountTemplate("template-about");
}

function renderContactView() {
  mountTemplate("template-contact");

  const contactForm = document.getElementById("contact-form");
  const successMsg = document.getElementById("contact-success-msg");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("contact-name");
      const emailInput = document.getElementById("contact-email");
      const subjectInput = document.getElementById("contact-subject");
      const messageInput = document.getElementById("contact-message");

      let isValid = true;

      // Validate fields
      [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = "red";
          isValid = false;
        } else {
          input.style.borderColor = "";
        }
      });

      // Special email validation
      if (emailInput.value.trim() && !validateEmail(emailInput.value)) {
        emailInput.style.borderColor = "red";
        isValid = false;
      }

      if (isValid) {
        // Mock API success action
        console.log("Contact submission payload:", {
          name: nameInput.value,
          email: emailInput.value,
          subject: subjectInput.value,
          message: messageInput.value
        });

        // Toggle UI states
        contactForm.style.display = "none";
        if (successMsg) {
          successMsg.style.display = "flex";
        }
      }
    });
    
    // Add reset validation border on keypress/input
    contactForm.querySelectorAll(".form-input").forEach(input => {
      input.addEventListener("input", () => {
        input.style.borderColor = "";
      });
    });
  }
}

/* ==================== GLOBAL UTILITY FUNCTIONS ==================== */

function initGlobalEvents() {
  // Mobile menu hamburger toggle
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }

  // Header background shrink and shadow on scroll
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Back to top floating button
  const backToTopBtn = document.getElementById("back-to-top-btn");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Footer Newsletter Form handling
  const newsletterForm = document.getElementById("footer-newsletter-form");
  const newsletterSuccess = document.getElementById("newsletter-success-msg");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById("newsletter-email");
      const submitBtn = document.getElementById("newsletter-submit");

      if (emailInput && validateEmail(emailInput.value.trim())) {
        console.log("Newsletter subscription:", emailInput.value.trim());
        
        emailInput.style.borderColor = "";
        emailInput.value = "";
        
        if (newsletterSuccess) {
          newsletterSuccess.style.display = "block";
          setTimeout(() => {
            newsletterSuccess.style.display = "none";
          }, 5000);
        }
      } else {
        if (emailInput) {
          emailInput.style.borderColor = "red";
          emailInput.addEventListener("input", function resetBorder() {
            emailInput.style.borderColor = "";
            emailInput.removeEventListener("input", resetBorder);
          });
        }
      }
    });
  }
}

/**
 * Returns HTML string representation for a blog post card
 */
function createPostCardHTML(post) {
  return `
    <article class="blog-card glass">
      <div class="card-img-wrap">
        <span class="card-category">${post.category}</span>
        <img src="${post.image}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span>${post.date}</span>
          <span>•</span>
          <span>${post.readTime}</span>
        </div>
        <h3 class="card-title">${post.title}</h3>
        <p class="card-excerpt">${post.excerpt}</p>
        <div class="card-footer">
          <div class="card-author">
            <div class="author-avatar">${post.author.avatar}</div>
            <span class="author-name">${post.author.name}</span>
          </div>
          <a href="#post/${post.id}" class="read-more-btn">
            Read Article
            <svg style="width: 1rem; height: 1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Basic regex email validation utility
 */
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}
