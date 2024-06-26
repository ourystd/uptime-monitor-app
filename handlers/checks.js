const crypto = require("node:crypto");
const db = require("../lib/data");
const {
  getTokenFromHeaders,
  getUserByToken,
  isAuthTokenValid,
} = require("../lib/helpers");

const MAX_CHECKS_PER_USER = 5;

const _checksHandlers = new Map();

_checksHandlers.set("post", async (data, callback) => {
  const token = getTokenFromHeaders(data.headers);
  if (!token) {
    return callback(400, {
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

_checksHandlers.set("get", async (data, callback) => {
  const token = getTokenFromHeaders(data.headers);
  if (!token || !isAuthTokenValid(token)) {
    return callback(401, {
      message: "Authentication required. Missing or invalid token.",
    });
  }

  const user = await getUserByToken(token);
  if (!user) {
    return callback(401, {
      message: "Authentication required. User not found.",
    });
  }

  const userChecks = user.checks || [];
  if (!userChecks.length) {
    return callback(200, { checks: [] });
  }

  const checks = [];
  for (const checkId of userChecks) {
    const check = await db.read("checks", checkId);
    checks.push(check);
  }

  const { id } = data.queryStringObj;
  if (id) {
    const check = checks.find((check) => check.id === id);
    if (!check) {
      return callback(404, { message: "Check not found" });
    }
    return callback(200, check);
  }

  callback(200, checks);
});

_checksHandlers.set("patch", async (data, callback) => {
  const token = getTokenFromHeaders(data.headers);
  if (!isAuthTokenValid(token)) {
    return callback(401, {
      message: "Authentication required. Missing or invalid token.",
    });
  }

  const user = await getUserByToken(token);
  if (!user) {
    return callback(404, {
      message: "Authentication required. User not found",
    });
  } else if (!user.checks || !user.checks.length) {
    return callback(404, { message: "No checks found" });
  }

  const { id } = data.queryStringObj;
  const userChecks = user.checks || [];
  if (!id || !userChecks.includes(id)) {
    return callback(404, { message: "No check with that id found" });
  }

  try {
    const check = await db.read("checks", id);
    const { protocol, url, method, successCodes, timeoutInSeconds } =
      data.payload;

    const newCheck = {
      ...check,
      protocol,
      url,
      method,
      successCodes,
      timeoutInSeconds,
    };

    const uneditableFields = ["id", "userPhone"];
    for (const field of Object.keys(check)) {
      if (!uneditableFields.includes(field) && !newCheck[field]) {
        console.log({ field });
        newCheck[field] = check[field];
      }
    }

    await db.update("checks", id, newCheck);
    return callback(200, newCheck);
  } catch (error) {
    console.error(error);
    return callback(500, { message: "Internal server error" });
  }
});

_checksHandlers.set("delete", async (data, callback) => {
  const token = getTokenFromHeaders(data.headers);

  if (!token) {
    return callback(400, {
      message: "Authentication required. Missing token.",
    });
  }

  const user = await getUserByToken(token);
  if (!user) {
    return callback(401, { message: "Authentication required" });
  }

  const { id } = data.payload;
  if (!id) {
    return callback(400, { message: "Bad request, missing fields" });
  }

  const userChecks = user.checks || [];
  if (!userChecks.length || !userChecks.includes(id)) {
    return callback(404, { message: "No checks found" });
  }

  try {
    await db.delete("checks", id);
    userChecks.splice(userChecks.indexOf(id), 1);
    await db.update("users", user.phone, { ...user, checks: userChecks });
    return callback(200, { message: "Check deleted" });
  } catch (error) {
    console.error(error);
    return callback(500, { message: "Internal server error" });
  }
});

const checks = (data, callback) => {
  if (!_checksHandlers.has(data?.method?.toLowerCase())) {
    return callback(405, {
      message: `Method not allowed`,
    });
  }
  _checksHandlers.get(data.method)(data, callback);
};

module.exports = checks;
