const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log("Launching headless Chrome from:", chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Track console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  // Inject listener instrumentation before the page loads
  await page.evaluateOnNewDocument(() => {
    window.activeListeners = [];
    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      window.activeListeners.push({
        element: this === window ? 'window' : (this === document ? 'document' : (this.tagName || this.constructor.name)),
        type,
        options: options ? JSON.stringify(options) : null
      });
      return originalAdd.apply(this, arguments);
    };

    window.activeIntervals = [];
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay) {
      const id = originalSetInterval.apply(this, arguments);
      window.activeIntervals.push({ id, delay });
      return id;
    };

    window.activeTimeouts = [];
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay) {
      const id = originalSetTimeout.apply(this, arguments);
      window.activeTimeouts.push({ id, delay });
      return id;
    };

    window.rafCount = 0;
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      window.rafCount++;
      return originalRAF.apply(this, arguments);
    };

    // Core Web Vitals observers
    window.lcpValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      window.lcpValue = lastEntry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    window.clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.clsValue += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // FID/INP observer
    window.inpValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const duration = entry.duration;
        if (duration > window.inpValue) {
          window.inpValue = duration;
        }
      }
    }).observe({ type: 'first-input', buffered: true });
  });

  console.log("Navigating to production landing page http://localhost:3001...");
  const navigationStart = Date.now();
  await page.goto('http://localhost:3001', { waitUntil: 'load' });
  const loadTime = Date.now() - navigationStart;

  console.log("Landing page loaded. Waiting 5 seconds for hydration and initial state...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("Scrolling page incrementally to trigger layout shifted assets and listener callbacks...");
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 200));
    await new Promise(r => setTimeout(r, 1000));
  }

  // Extract profiled stats
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcpEntry = paint.find(e => e.name === 'first-contentful-paint');
    
    // Count scroll/resize listeners
    const scrollListeners = window.activeListeners.filter(l => l.type === 'scroll');
    const resizeListeners = window.activeListeners.filter(l => l.type === 'resize');
    const intersectionObservers = window.activeListeners.filter(l => l.element.includes('Observer') || l.type.includes('observe'));

    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : null,
      fcp: fcpEntry ? fcpEntry.startTime : null,
      lcp: window.lcpValue,
      cls: window.clsValue,
      inp: window.inpValue,
      domInteractive: nav ? nav.domInteractive : null,
      domComplete: nav ? nav.domComplete : null,
      loadEventEnd: nav ? nav.loadEventEnd : null,
      listenersCount: window.activeListeners.length,
      scrollListeners,
      resizeListeners,
      intervals: window.activeIntervals,
      timeoutsCount: window.activeTimeouts.length,
      rafsRegistered: window.rafCount
    };
  });

  console.log("\n=== PERFORMANCE AUDIT METRICS ===");
  console.log(JSON.stringify({ metrics, logs: logs.slice(0, 10) }, null, 2));

  await browser.close();
  console.log("Profiling run finished.");
})();
