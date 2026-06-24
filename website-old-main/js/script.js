async function loadHTML(id, file) {
  const el = document.getElementById(id);
  const res = await fetch(file);
  if (res.ok) {
    el.innerHTML = await res.text();
    if (id === "top-bar-thing") {
      highlightActiveLink(); // after header loads
      initScrollHeader(); // Initialize scroll effect after header loads
      initLanguage(); // Set correct language button text
      initTheme(); // Apply saved theme preference
      if (typeof initTranslations === 'function') {
        initTranslations(); // Apply translations after header loads
      }
    }
    if (id === "bottom-bar-thing") {
      if (typeof initTranslations === 'function') {
        initTranslations(); // Apply translations after footer loads
      }
    }
  }
}

// Highlight the current nav link
function highlightActiveLink() {
  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("#top-bar-thing .nav-link").forEach(link => {
    if (link.getAttribute("data-page") === currentPage) {
      link.classList.add("active");
    }
  });
}

// Hides header on scroll down, shows on scroll up
function initScrollHeader() {
  let lastScrollTop = 0;
  const header = document.getElementById('mainHeader');
  if (!header) return; // Exit if header not found

  window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > header.offsetHeight) {
      // Scrolling down
      header.style.top = `-${header.offsetHeight}px`;
    } else {
      // Scrolling up
      header.style.top = '0';
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
}

loadHTML("top-bar-thing", "elements/header.html");
loadHTML("bottom-bar-thing", "elements/footer.html");

// Language toggle functionality
function toggleLanguage() {
  const langToggle = document.getElementById('langToggle');
  const currentLang = localStorage.getItem('language') || 'en';
  const newLang = currentLang === 'en' ? 'vn' : 'en';
  
  localStorage.setItem('language', newLang);
  
  // Update toggle visual state
  if (langToggle) {
    if (newLang === 'vn') {
      langToggle.classList.add('vn');
    } else {
      langToggle.classList.remove('vn');
    }
  }
  
  // Dispatch event for other components to react to language change
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
}

// Initialize language on page load
function initLanguage() {
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    const currentLang = localStorage.getItem('language') || 'en';
    if (currentLang === 'vn') {
      langToggle.classList.add('vn');
    } else {
      langToggle.classList.remove('vn');
    }
  }
}

// Run initLanguage after header loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initLanguage, 100); // Small delay to ensure header is loaded
  initTheme(); // Initialize theme on page load
});

// Theme toggle functionality
function toggleTheme() {
  const body = document.body;
  const isLightMode = body.classList.contains('light-mode');
  
  if (isLightMode) {
    body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
  }
}

// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}