const {
  createAuthToken,
  getUser,
  hashPassword,
  isAuthTokenValid,
  getUserByToken,
} = require("../lib/helpers");

const _tokensHandlers = new Map();

_tokensHandlers.set("post", async (data, callback) => {
  const { phone, password } = data.payload;
  const user = await getUser(phone);
  if (!user || user.password !== hashPassword(password)) {
    return callback(400, { message: "Invalid credentials" });
  }

  const token = createAuthToken(user);
  callback(200, { token });
});

_tokensHandlers.set("put", async (data, callback) => {
  const { token, extend } = data.payload;
  if (!token || !isAuthTokenValid(token)) {
    return callback(401, { message: "Authentication required" });
  }

  const user = await getUserByToken(token);
  if (user && extend) {
    const newToken = createAuthToken(user);
    return callback(200, { token: newToken });
  }

  return callback(400, {
    message: "Missing required field(s) or invalid field(s)",
  });
});

/**
 * Invalidate (revoke) an existing token
 *
 */
_tokensHandlers.set("delete", async (data, callback) => {
  const { Authorization } = data.headers;
  const token = Authorization?.replace(/^Bearer /gi, "")?.trim();
  if (!token || !isAuthTokenValid(token)) {
    return callback(401, { message: "Authentication required" });
  }

  // add token to revocation list
  await db.create("revoked_tokens", token, { revokatedAt: Date.now() });

  callback(200);
});

function tokens(data, callback) {
  if (!_tokensHandlers.has(data?.method)) {
    return callback(405, {
      message: `Method not allowed`,
    });
  }

  return _tokensHandlers.get(data.method)(data, callback);
}

module.exports = tokens;
