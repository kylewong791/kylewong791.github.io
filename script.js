/* =============================================================
   script.js — Kyle Wong Portfolio
   Step 4b: Canvas animation, typewriter, hero load trigger
   ============================================================= */


/* -------------------------------------------------------------
   1. NEURAL NETWORK CANVAS ANIMATION
   50 nodes float around the hero section, drawing connecting
   lines to any other node within 120px. Nodes are gently
   repelled from the cursor. Color is read from --accent-r/g/b
   CSS variables so it updates with dark mode automatically.
   ------------------------------------------------------------- */
(function initCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const NODE_COUNT       = 50;
  const CONNECT_DIST     = 120;   // px — max distance to draw a line
  const NODE_OPACITY     = 0.28;
  const LINE_OPACITY_MAX = 0.18;
  const RADIUS_MIN       = 2;     // px
  const RADIUS_MAX       = 4;     // px
  const SPEED_RANGE      = 0.55;  // max px per frame in each axis
  const REPEL_DIST       = 120;   // px — mouse repulsion radius
  const REPEL_STRENGTH   = 0.3;   // acceleration added per frame at closest point
  const SPEED_CAP        = SPEED_RANGE * 4; // max speed after repulsion boost

  let nodes = [];
  let raf;
  const mouse = { x: -9999, y: -9999 };

  /* Read the current accent RGB from CSS custom properties */
  function getAccentRGB() {
    const style = getComputedStyle(document.body);
    const r = style.getPropertyValue('--accent-r').trim();
    const g = style.getPropertyValue('--accent-g').trim();
    const b = style.getPropertyValue('--accent-b').trim();
    return { r: Number(r), g: Number(g), b: Number(b) };
  }

  /* Fit canvas to its DOM size */
  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  /* Build the initial node array — each node gets its own random radius */
  function buildNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x:      Math.random() * canvas.width,
        y:      Math.random() * canvas.height,
        vx:     (Math.random() - 0.5) * SPEED_RANGE * 2,
        vy:     (Math.random() - 0.5) * SPEED_RANGE * 2,
        radius: RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN),
      });
    }
  }

  /* Single animation frame */
  function draw() {
    const { r, g, b } = getAccentRGB();
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    /* Move, apply mouse repulsion, and bounce nodes */
    for (const node of nodes) {
      /* Gentle repulsion — accelerate away from cursor proportional to proximity */
      const mdx   = node.x - mouse.x;
      const mdy   = node.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < REPEL_DIST && mdist > 0) {
        const force = REPEL_STRENGTH * (1 - mdist / REPEL_DIST);
        node.vx += (mdx / mdist) * force;
        node.vy += (mdy / mdist) * force;

        /* Cap speed so repulsion can't fling nodes off screen */
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > SPEED_CAP) {
          node.vx = (node.vx / speed) * SPEED_CAP;
          node.vy = (node.vy / speed) * SPEED_CAP;
        }
      }

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > w) node.vx *= -1;
      if (node.y < 0 || node.y > h) node.vy *= -1;
    }

    /* Draw connecting lines */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DIST) {
          /* Opacity fades as distance approaches CONNECT_DIST */
          const alpha = LINE_OPACITY_MAX * (1 - dist / CONNECT_DIST);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }
    }

    /* Draw nodes on top of lines */
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${NODE_OPACITY})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  /* Start everything */
  function start() {
    resize();
    buildNodes();
    cancelAnimationFrame(raf);
    draw();
  }

  /* Track mouse position relative to the canvas */
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* Rebuild on window resize — debounced to avoid thrash */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 120);
  });

  start();
})();


/* -------------------------------------------------------------
   2. TYPEWRITER
   Cycles between phrases, typing forward then deleting.
   Started externally via startTypewriter() so it can be
   delayed until after the hero load animation begins.
   ------------------------------------------------------------- */
const TYPEWRITER_PHRASES = [
  'Statistics & Data Science Grad.',
  'AI Researcher.',
];

const TYPE_SPEED   = 72;   // ms per character forward
const DELETE_SPEED = 42;   // ms per character backward
const PAUSE_END    = 2000; // ms to hold completed phrase

function startTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  let phraseIndex = 0;
  let charIndex   = 0;
  let deleting    = false;

  function tick() {
    const phrase = TYPEWRITER_PHRASES[phraseIndex];

    if (!deleting) {
      /* Type one character forward */
      charIndex++;
      el.textContent = phrase.slice(0, charIndex);

      if (charIndex === phrase.length) {
        /* Finished typing — pause before deleting */
        deleting = true;
        setTimeout(tick, PAUSE_END);
        return;
      }
      setTimeout(tick, TYPE_SPEED);

    } else {
      /* Delete one character backward */
      charIndex--;
      el.textContent = phrase.slice(0, charIndex);

      if (charIndex === 0) {
        /* Finished deleting — move to next phrase */
        deleting = false;
        phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
        setTimeout(tick, TYPE_SPEED);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  tick();
}


/* -------------------------------------------------------------
   3. HERO LOAD TRIGGER
   Adds .loaded to #hero after 200ms so the CSS staggered
   transitions fire. Starts the typewriter after 900ms to
   give the headline element time to appear first.
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('hero');

  /* Trigger CSS load animations */
  setTimeout(() => {
    if (hero) hero.classList.add('loaded');
  }, 200);

  /* Start typewriter after headline is visible */
  setTimeout(startTypewriter, 900);
});


/* =============================================================
   4. DARK MODE PRE-LOAD
   Runs synchronously (script is at end of <body> so document.body
   exists). Applies saved preference before the first paint so
   there is no flash of the wrong theme.
   ============================================================= */
(function applyStoredTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
})();


/* =============================================================
   5. PROJECTS DATA
   Single source of truth. To add a project, add one object here.
   ============================================================= */
const projects = [
  {
    short: 'Vision & Comorbidity',
    sub:   'Statistical consulting',
    full:  'Vision Clarity and Comorbidity: A Statistical Consulting Case Study',
    desc:  'Collaborated with UCLA Health ophthalmologists to analyze factors influencing blurry vision. Conducted logistic regression, ROC curve analysis, and marginal models. Proactively identified recall bias in self-reported data, outside the original scope.',
    tags:  ['R', 'Logistic regression', 'ROC curves', 'UCLA Health'],
    links: [{ label: 'Report', href: 'https://drive.google.com/file/d/1MdxVf1MUYEafCVJ1NXV2BAmq_htOqwGE/view?usp=sharing' }],
    icon:  '<circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/>',
  },
  {
    short: 'COVID & Education',
    sub:   'Data analysis · Policy',
    full:  'COVID-19\'s Impact on Education',
    desc:  'Analyzed pre and post pandemic test scores across U.S. school districts using the Stanford Education Data Archive. Advocated for bias-free methodology and surfaced socioeconomic disparities through a public-facing website.',
    tags:  ['Python', 'Data viz', 'Stanford SEDA', 'Policy'],
    links: [{ label: 'Website', href: 'https://coviducation.humspace.ucla.edu/' }],
    icon:  '<circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="18.5" x2="12" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2" y1="12" x2="5.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="18.5" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="4.9" y1="4.9" x2="7.4" y2="7.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="16.6" y1="16.6" x2="19.1" y2="19.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="19.1" y1="4.9" x2="16.6" y2="7.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="4.9" y1="19.1" x2="7.4" y2="16.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  },
  {
    short: 'Alcoholic Status Prediction',
    sub:   'Machine learning',
    full:  'Predicting Alcoholic Status Using Person\'s Vitals',
    desc:  'Built and compared classification models including logistic regression, LDA, QDA, k-NN, and decision trees on Korea\'s National Health Insurance dataset. Handled missing data via imputation and optimized via cross-validation.',
    tags:  ['R', 'Classification', 'k-NN', 'Cross-validation'],
    links: [{ label: 'Report', href: 'https://drive.google.com/file/d/1R5eu7fUqkYkn1-agJZLWKi1KGo1MSCXt/view?usp=sharing' }],
    icon:  '<polyline points="2 12 5 12 7 6 9 18 11 10 13 14 15 12 22 12"/>',
  },
  {
    short: 'DNN Hyperparameter Tuning',
    sub:   'Deep learning',
    full:  'Deep Neural Network Hyperparameter Optimization',
    desc:  'Used surrogate models including linear regression and Kriging to approximate DNN performance on Fashion MNIST without retraining across every configuration. Shipped under real compute constraints.',
    tags:  ['Python', 'Keras', 'TensorFlow', 'Surrogate models'],
    links: [{ label: 'Presentation', href: 'https://drive.google.com/file/d/1CYZZ6kL43Fk4zh-kJRWCYH1Zqjw0hEsX/view' }],
    icon:  '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h5M17 5h-3M12 10V7M7 19h3M17 19h-3M12 17v-3M6.5 7l4 3.5M17.5 7l-4 3.5M6.5 17l4-3.5M17.5 17l-4-3.5"/>',
  },
  {
    short: 'Juvenile Crime in LA',
    sub:   'EDA · Public data',
    full:  'An Analysis of Juvenile Crime in Los Angeles',
    desc:  'Analyzed the LAPD dataset in R, conducting EDA on juvenile vs. adult crime patterns. Applied chi-squared tests to reveal significant associations. Found that 13% of LA juvenile crimes involve firearms, double the adult rate.',
    tags:  ['R', 'EDA', 'Chi-squared', 'LAPD data'],
    links: [
      { label: 'Report', href: 'https://drive.google.com/file/d/1OxDZ-gcYvAyaGQp5mMtGiLBEE2z_hb1J/view?usp=sharing' },
      { label: 'Poster', href: 'https://drive.google.com/file/d/1o2T2v05JPmUKemVV3txB31Ho7CxoJo7s/view?usp=sharing' },
    ],
    icon:  '<path d="M14 2l8 8-4 4-8-8 4-4z"/><path d="M2 22l7-7"/><path d="M10 15l-3 3"/><path d="M2 22h4"/>',
  },
  {
    short: 'Nicotine vs. Kava on Memory',
    sub:   'Experimental design',
    full:  'Nicotine vs. Kava and Their Effects on Human Memory',
    desc:  'Constructed virtual experiments to simulate effects of nicotine and kava on human memory. Used web scraping in R, applied a 2-way randomized block design and linear regression, and visualized results with ANOVA and interaction plots.',
    tags:  ['R', 'ANOVA', 'Web scraping', 'Experimental design'],
    links: [{ label: 'Report', href: 'https://drive.google.com/file/d/1JfsT5nFp5DpC-nDz5WerzK6hkVrRJIR6/view' }],
    icon:  '<path d="M9 21h6M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 016-6z"/><path d="M9 17h6"/>',
  },
  {
    short: 'Boston Housing Analysis',
    sub:   'Regression · EDA',
    full:  'Boston Housing Prices Analysis',
    desc:  'Analyzed Boston housing data using NumPy, Pandas, Seaborn, and Matplotlib. Developed a predictive model highlighting the relationship between property values and clean air demand.',
    tags:  ['Python', 'Pandas', 'Seaborn', 'Regression'],
    links: [],
    icon:  '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  },
  {
    short: 'Twitter Bot',
    sub:   'API · Automation',
    full:  'Twitter Bot',
    desc:  'Built a bot using Tweepy to interact with the Twitter API. Authenticated via OAuth 2.0, analyzed conversations using Twitter endpoints, and deployed on PythonAnywhere for continuous cloud-based operation.',
    tags:  ['Python', 'Tweepy', 'OAuth 2.0', 'PythonAnywhere'],
    links: [{ label: 'Code', href: 'https://github.com/kylewong791/MinionTwitterBot' }],
    icon:  '<path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>',
  },
];


/* =============================================================
   6. PROJECTS RENDERER + DRAWER BEHAVIOR
   Builds cells and pair-shared drawers from the data array,
   then wires up click handlers for open/close/swap.
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- DOM helpers ---- */

  /* Chevron SVG — CSS rotates it 180deg when parent is .active */
  function createChevron() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'cell-chevron');
    svg.setAttribute('viewBox', '0 0 10 6');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M1 1l4 4 4-4');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  /* Build a single grid cell from a project object */
  function buildCell(proj, index) {
    const cell = document.createElement('div');
    cell.className  = 'project-cell reveal';
    cell.dataset.index = String(index);
    cell.dataset.col   = String(index % 2); // 0 = left col, 1 = right col

    const top  = document.createElement('div');
    top.className = 'cell-top';

    /* Icon — 40px square container with inline SVG */
    const iconWrap = document.createElement('div');
    iconWrap.className = 'cell-icon';
    iconWrap.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      proj.icon + '</svg>';

    const name = document.createElement('span');
    name.className   = 'cell-name';
    name.textContent = proj.short;

    const sub = document.createElement('span');
    sub.className   = 'cell-sub';
    sub.textContent = proj.sub;

    top.appendChild(iconWrap);
    top.appendChild(name);
    top.appendChild(sub);

    const bottom = document.createElement('div');
    bottom.className = 'cell-bottom';
    bottom.appendChild(createChevron());

    cell.appendChild(top);
    cell.appendChild(bottom);
    return cell;
  }

  /* Build an empty drawer shell (content filled on demand) */
  function buildDrawer() {
    const drawer  = document.createElement('div');
    drawer.className = 'drawer';

    const inner   = document.createElement('div');
    inner.className = 'drawer-inner';

    const content = document.createElement('div');
    content.className = 'drawer-content';

    const left  = document.createElement('div');
    left.className = 'drawer-left';

    const right = document.createElement('div');
    right.className = 'drawer-right';

    const tagsWrap  = document.createElement('div');
    tagsWrap.className = 'drawer-tags';

    const linksWrap = document.createElement('div');
    linksWrap.className = 'drawer-links';

    right.appendChild(tagsWrap);
    right.appendChild(linksWrap);
    content.appendChild(left);
    content.appendChild(right);
    inner.appendChild(content);
    drawer.appendChild(inner);
    return drawer;
  }

  /* Populate a drawer's content area with a project's data */
  function fillDrawer(drawer, proj) {
    const left      = drawer.querySelector('.drawer-left');
    const tagsWrap  = drawer.querySelector('.drawer-tags');
    const linksWrap = drawer.querySelector('.drawer-links');

    /* Left column — title + description */
    left.innerHTML = '';
    const title = document.createElement('h3');
    title.className   = 'drawer-title';
    title.textContent = proj.full;

    const desc = document.createElement('p');
    desc.className   = 'drawer-desc';
    desc.textContent = proj.desc;

    left.appendChild(title);
    left.appendChild(desc);

    /* Right column — tags */
    tagsWrap.innerHTML = '';
    proj.tags.forEach(tagText => {
      const span = document.createElement('span');
      span.className   = 'tag';
      span.textContent = tagText;
      tagsWrap.appendChild(span);
    });

    /* Right column — link buttons */
    linksWrap.innerHTML = '';
    proj.links.forEach(({ label, href }) => {
      const a = document.createElement('a');
      a.className  = 'drawer-link';
      a.textContent = label;
      a.href       = href;
      a.target     = '_blank';
      a.rel        = 'noopener noreferrer';
      linksWrap.appendChild(a);
    });
  }

  /* ---- Drawer open/close state ---- */
  let activeCell   = null;
  let activeDrawer = null;

  function closeActive() {
    if (activeDrawer) activeDrawer.classList.remove('open');
    if (activeCell)   activeCell.classList.remove('active');
    activeCell   = null;
    activeDrawer = null;
  }

  function openCell(cell, drawer, proj) {
    /* Close a different pair's drawer first */
    if (activeDrawer && activeDrawer !== drawer) {
      closeActive();
    }
    fillDrawer(drawer, proj);
    drawer.classList.add('open');
    cell.classList.add('active');
    activeCell   = cell;
    activeDrawer = drawer;
  }

  /*
   * handleCellClick covers three cases:
   *   1. Same cell clicked again     → close
   *   2. Sibling cell (same pair)    → update content, swap active cell
   *   3. Cell in a different pair    → close old drawer, open new
   */
  function handleCellClick(cell, drawer, proj, siblingCell) {
    if (activeCell === cell) {
      closeActive();
    } else if (activeDrawer === drawer && siblingCell && activeCell === siblingCell) {
      /* Swap within the same pair — no height animation needed */
      siblingCell.classList.remove('active');
      cell.classList.add('active');
      fillDrawer(drawer, proj);
      activeCell = cell;
    } else {
      openCell(cell, drawer, proj);
    }
  }

  /* ---- Build the grid ---- */
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  /* Scroll reveal observer — defined before buildGrid() so it can be referenced inside */
  const cellObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const cell  = entry.target;
      const delay = cell.dataset.col === '1' ? 80 : 0;
      setTimeout(() => cell.classList.add('visible'), delay);
      cellObserver.unobserve(cell);
    });
  }, { threshold: 0.1 });

  function buildGrid() {
    /* Wipe existing cells/drawers and reset open-drawer state */
    grid.innerHTML = '';
    activeCell   = null;
    activeDrawer = null;

    if (window.matchMedia('(max-width: 768px)').matches) {
      /* Mobile: single-column layout — each cell gets its own drawer directly below it */
      for (let i = 0; i < projects.length; i++) {
        const proj   = projects[i];
        const cell   = buildCell(proj, i);
        const drawer = buildDrawer();

        cell.addEventListener('click', () =>
          handleCellClick(cell, drawer, proj, null)
        );

        grid.appendChild(cell);
        grid.appendChild(drawer);
      }
    } else {
      /* Desktop: pairs of cells share one drawer after the pair */
      for (let i = 0; i < projects.length; i += 2) {
        const proj0 = projects[i];
        const proj1 = projects[i + 1]; /* undefined if odd total */

        const cell0  = buildCell(proj0, i);
        const cell1  = proj1 ? buildCell(proj1, i + 1) : null;
        const drawer = buildDrawer();

        cell0.addEventListener('click', () =>
          handleCellClick(cell0, drawer, proj0, cell1)
        );

        if (cell1) {
          cell1.addEventListener('click', () =>
            handleCellClick(cell1, drawer, proj1, cell0)
          );
        }

        grid.appendChild(cell0);
        if (cell1) grid.appendChild(cell1);
        grid.appendChild(drawer);
      }
    }

    /* Observe newly built cells for scroll reveal */
    grid.querySelectorAll('.project-cell').forEach(cell => cellObserver.observe(cell));
  }

  /* Initial build */
  buildGrid();

  /* Rebuild when crossing the 768px breakpoint — handles resize and DevTools emulation */
  window.matchMedia('(max-width: 768px)').addEventListener('change', buildGrid);
});


/* =============================================================
   7. SCROLL PROGRESS BAR
   No CSS transition on width — raw value feels most responsive.
   ============================================================= */
(function initProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollable = document.body.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
})();


/* =============================================================
   8. SCROLL REVEAL — INTERSECTION OBSERVER
   Observes all static .reveal elements (non-cell). Project cells
   are observed separately in section 6 for column staggering.
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  /* Exclude .project-cell — handled by cellObserver in section 6 */
  document.querySelectorAll('.reveal:not(.project-cell)').forEach(el => {
    observer.observe(el);
  });
});


/* =============================================================
   9. DARK MODE TOGGLE
   Click handler toggles .dark on <body>, saves to localStorage,
   and updates the button label text.
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const label = toggle.querySelector('.toggle-label');

  function syncLabel() {
    label.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark';
  }

  /* Sync label to match whatever theme was applied by section 4 */
  syncLabel();

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    syncLabel();
  });
});


/* =============================================================
   10. SMOOTH SCROLL
   Nav anchor links and hero CTA buttons use scrollIntoView
   instead of the default instant jump.
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  /* Nav links */
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Hero CTA buttons */
  const ctaProjects = document.querySelector('.hero-ctas .btn-primary');
  const ctaContact  = document.querySelector('.hero-ctas .btn-secondary');

  if (ctaProjects) {
    ctaProjects.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector('#projects');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (ctaContact) {
    ctaContact.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector('#contact');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});


/* =============================================================
   11. HAMBURGER MENU
   Toggles .open on both the nav-menu dropdown and the hamburger
   button (CSS uses #hamburger.open for the → X animation).
   Closes the menu when any nav link inside it is clicked.
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.querySelector('.nav-menu');
  if (!hamburger || !navMenu) return;

  /* Toggle open/close on button click */
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  /* Close menu when any nav link inside it is clicked */
  navMenu.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });
});


/* =============================================================
   12. BACK TO TOP BUTTON
   Shows after scrolling 400px down; hides when back near top.
   Click smoothly scrolls to the top of the page.
   ============================================================= */
(function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* =============================================================
   13. SPOTIFY WIDGET
   Fetches live now-playing data on load and every 30 seconds.
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const widget   = document.querySelector('.spotify-widget');
  if (!widget) return;

  const trackEl  = widget.querySelector('.spotify-track');
  const artistEl = widget.querySelector('.spotify-artist');
  const labelEl  = widget.querySelector('.spotify-label');
  const artEl    = widget.querySelector('.album-art');
  const barsEl   = widget.querySelector('.s-bars');

  function update(data) {
    if (data && data.isPlaying) {
      /* Currently playing */
      labelEl.textContent  = 'Listening to';
      trackEl.textContent  = data.title  || '';
      artistEl.textContent = data.artist || '';
      barsEl.classList.remove('paused');
      widget.classList.remove('not-playing');
    } else if (data && data.title) {
      /* Not playing but recently played track available */
      labelEl.textContent  = 'Last listened to';
      trackEl.textContent  = data.title;
      artistEl.textContent = data.artist || '';
      barsEl.classList.add('paused');
      widget.classList.remove('not-playing');
    } else {
      /* No data at all */
      labelEl.textContent  = 'Listening to';
      trackEl.textContent  = 'Not playing';
      artistEl.textContent = '';
      barsEl.classList.add('paused');
      widget.classList.add('not-playing');
    }

    /* Album art — shared across all states */
    if (data && data.albumArt) {
      artEl.style.backgroundImage = `url(${data.albumArt})`;
      artEl.classList.add('has-art');
    } else {
      artEl.style.backgroundImage = '';
      artEl.classList.remove('has-art');
    }
  }

  function fetchNowPlaying() {
    fetch('https://spotify-now-playing-dun-alpha.vercel.app/api/now-playing')
      .then(res => res.ok ? res.json() : null)
      .then(data => update(data))
      .catch(() => update(null));
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, 30000);
});
