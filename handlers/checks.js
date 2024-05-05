const crypto = require("node:crypto");
const db = require("../lib/data");
const { getTokenFromHeaders, getUserByToken } = require("../lib/helpers");

const MAX_CHECKS_PER_USER = 5;

const _checksHandlers = new Map();

_checksHandlers.set("post", async (data, callback) => {
  const token = getTokenFromHeaders(data.headers);
  if (!token) {
    return callback(401, {
      message: "Authentication required. Missing token.",
    });
  }

  const { protocol, url, method, successCodes, timeoutInSeconds } =
    data.payload;

  if (!protocol || !url || !method || !successCodes || !timeoutInSeconds) {
    return callback(400, { message: "Bad request, missing fields" });
  }

  const user = await getUserByToken(token);
  console.log({ token, user });
  if (!user) {
    return callback(401, { message: "Authentication required" });
  }

  const userChecks = user.checks || [];
  if (userChecks.length >= MAX_CHECKS_PER_USER) {
    return callback(403, {
      message: `Maximum number of checks (${MAX_CHECKS_PER_USER} / user) reached`,
    });
  }

  const check = {
    id: crypto.randomUUID(),
    userPhone: user.phone,
    protocol,
    url,
    method,
    successCodes,
    timeoutInSeconds,
  };

  try {
    db.create("checks", check.id, check);
    userChecks.push(check.id);
    await db.update("users", user.phone, { ...user, checks: userChecks });
    return callback(201, check);
  } catch (error) {
    return callback(500, { message: "Internal server error" });
  }
});

const checks = (data, callback) => {
  if (!_checksHandlers.has(data?.method)) {
    return callback(405, {
      message: `Method not allowed`,
    });
  }
  _checksHandlers.get(data.method)(data, callback);
};

module.exports = checks;
