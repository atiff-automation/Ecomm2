/**
 * Bundle Size Limits Configuration - Malaysian E-commerce Platform
 * Monitor and enforce bundle size constraints
 */

module.exports = [
  {
    name: "Main Bundle (Pages)",
    path: ".next/static/chunks/pages/**/*.js",
    limit: "400 KB",
    webpack: true,
    running: false
  },
  {
    name: "Admin Bundle",
    path: ".next/static/chunks/**/admin*.js", 
    limit: "200 KB",
    webpack: true,
    running: false
  },
  {
    name: "Vendor Bundle",
    path: ".next/static/chunks/vendors-*.js",
    limit: "500 KB", 
    webpack: true,
    running: false
  },
  {
    name: "UI Components Bundle",
    path: ".next/static/chunks/ui-*.js",
    limit: "150 KB",
    webpack: true,
    running: false
  },
  {
    name: "Framework Bundle",
    path: ".next/static/chunks/framework-*.js",
    limit: "300 KB",
    webpack: true,
    running: false
  },
  {
    name: "Main CSS",
    path: ".next/static/css/**/*.css",
    limit: "100 KB"
  },
  {
    name: "Critical CSS",
    path: ".next/static/css/critical*.css",
    limit: "50 KB"
  },
  {
    name: "Total Initial JS",
    path: [
      ".next/static/chunks/framework-*.js",
      ".next/static/chunks/main-*.js",
      ".next/static/chunks/pages/_app-*.js"
    ],
    limit: "600 KB",
    webpack: true
  }
];