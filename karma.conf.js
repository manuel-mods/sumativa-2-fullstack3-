module.exports = function (config) {
  config.set({
    // ... other configurations
    reporters: [
      "progress",
      "kjhtml",
      "sonarqubeUnit",
      { type: "lcov", subdir: "." },
      { type: "text-summary" },
    ],
    sonarqubeUnitReporter: {
      sonarQubeVersion: "LATEST", // or specific version like '6.7'
      outputFile: "reports/ut_report.xml",
      overrideTestDescription: true,
      testPaths: ["./src"],
      useBrowserName: false,
    },
    // ...
  });
};
