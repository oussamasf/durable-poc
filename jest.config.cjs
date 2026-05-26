module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/jest.xray-setup.cjs"],
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  clearMocks: true,
  verbose: true,
  testRegex: ".*\\.test\\.ts$",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
  },
};
