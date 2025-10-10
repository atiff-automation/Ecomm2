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
      const results = {};
      
      // LCP - Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        results.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID - First Input Delay (simulated with interaction)
      results.fid = 0; // Cannot measure without real user interaction
      
      // CLS - Cumulative Layout Shift
      new PerformanceObserver((entryList) => {
        let cls = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        results.cls = cls;
      }).observe({ entryTypes: ['layout-shift'] });
      
      // FCP - First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      results.fcp = fcpEntry ? fcpEntry.startTime : 0;
      
      // TTFB - Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      results.ttfb = navigationEntry ? navigationEntry.responseStart : 0;
      
      setTimeout(() => resolve(results), 3000);
    });
  });
  
  console.log('✅ Performance Metrics:\n');
  console.log(`⏱️  Page Load Time: ${loadTime}ms`);
  console.log(`🎨 First Contentful Paint (FCP): ${metrics.fcp.toFixed(2)}ms`);
  console.log(`🖼️  Largest Contentful Paint (LCP): ${metrics.lcp.toFixed(2)}ms`);
  console.log(`⚡ Time to First Byte (TTFB): ${metrics.ttfb.toFixed(2)}ms`);
  console.log(`📐 Cumulative Layout Shift (CLS): ${metrics.cls.toFixed(3)}`);
  
  console.log('\n📊 Performance Targets:');
  console.log(`LCP Target: < 2500ms - ${metrics.lcp < 2500 ? '✅ PASS' : '❌ FAIL'} (${metrics.lcp.toFixed(2)}ms)`);
  console.log(`FCP Target: < 1800ms - ${metrics.fcp < 1800 ? '✅ PASS' : '❌ FAIL'} (${metrics.fcp.toFixed(2)}ms)`);
  console.log(`CLS Target: < 0.1 - ${metrics.cls < 0.1 ? '✅ PASS' : '❌ FAIL'} (${metrics.cls.toFixed(3)})`);
  
  await browser.close();
})();
