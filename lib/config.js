const environments = {};

environments.base = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "base",

  hashingSecret:
    process.env.HASHING_SECRET ||
    "secretSalt--6ef579e83beb75a937d5ade07a11bce5--should_only_be_used_in_tests",
};

environments.development = {
  ...environments.base,
  httpPort: 4000,
  httpsPort: 4001,
  envName: "development",
};

environments.production = {
  ...environments.base,
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
};

const currentEnv =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

const config =
  typeof environments[currentEnv] === "object"
    ? environments[currentEnv]
    : environments.development;

module.exports = config;
