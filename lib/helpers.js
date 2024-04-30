const crypto = require("node:crypto");
const { hashingSecret } = require("./config");

const hashPassword = (password) => {
  try {
    return crypto
      .createHmac("sha256", hashingSecret)
      .update(password)
      .digest("hex");
  } catch (error) {
    return false;
  }
};

const comparePassword = (password, hash) => {
  return hashPassword(password) === hash;
};

const parseJSONtoObject = (data) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

module.exports = {
  parseJSONtoObject,
  hashPassword,
  comparePassword,
};
