const environments = {};

environments.development = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "development",
};

environments.production = {
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
