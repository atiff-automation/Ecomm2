const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📊 Measuring performance metrics for http://localhost:3000...\n');

  const startTime = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;

  // Get Web Vitals metrics
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const results = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      };

      // LCP - Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          results.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // CLS - Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              results.cls += entry.value;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }

      // FCP - First Contentful Paint
      try {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        results.fcp = fcpEntry ? fcpEntry.startTime : 0;
      } catch (e) {
        // FCP not supported
      }

      // TTFB - Time to First Byte
      try {
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        results.ttfb = navigationEntry ? navigationEntry.responseStart : 0;
      } catch (e) {
        // TTFB not supported
      }

      setTimeout(() => resolve(results), 3000);
    });
  });

  console.log('✅ Performance Metrics:\n');
  console.log('Page Load Time: ' + loadTime + 'ms');
  console.log('First Contentful Paint (FCP): ' + metrics.fcp.toFixed(2) + 'ms');
  console.log('Largest Contentful Paint (LCP): ' + metrics.lcp.toFixed(2) + 'ms');
  console.log('Time to First Byte (TTFB): ' + metrics.ttfb.toFixed(2) + 'ms');
  console.log('Cumulative Layout Shift (CLS): ' + metrics.cls.toFixed(3));

  console.log('\n📊 Performance Targets:');
  const lcpPass = metrics.lcp < 2500;
  const fcpPass = metrics.fcp < 1800;
  const clsPass = metrics.cls < 0.1;

  console.log('LCP Target: < 2500ms - ' + (lcpPass ? '✅ PASS' : '❌ FAIL') + ' (' + metrics.lcp.toFixed(2) + 'ms)');
  console.log('FCP Target: < 1800ms - ' + (fcpPass ? '✅ PASS' : '❌ FAIL') + ' (' + metrics.fcp.toFixed(2) + 'ms)');
  console.log('CLS Target: < 0.1 - ' + (clsPass ? '✅ PASS' : '❌ FAIL') + ' (' + metrics.cls.toFixed(3) + ')');

  const allPass = lcpPass && fcpPass && clsPass;
  console.log('\n' + (allPass ? '✅ ALL PERFORMANCE TARGETS MET' : '⚠️  SOME PERFORMANCE TARGETS NOT MET'));

  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
