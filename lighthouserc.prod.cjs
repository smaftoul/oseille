module.exports = {
  ci: {
    collect: {
      startServerCommand: "vite preview --port 4173 --strictPort --base /oseille/",
      startServerReadyPattern: "Local:",
      url: ["http://localhost:4173/oseille/"],
      numberOfRuns: 3,
      chromeFlags: "--headless --no-sandbox --disable-gpu --disable-dev-shm-usage",
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 1 }],
        "categories:performance": ["error", { minScore: 0.9 }],
        "errors-in-console": ["error"],
      },
    },
  },
};