const db = require("../lib/data");
const crypto = require("node:crypto");
const { hashingSecret } = require("./config");
const fs = require("node:fs");

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

function base64urlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str) {
  return Buffer.from(
    str.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString();
}

function generateJWT(payload, secret = hashingSecret, algorithm = "sha256") {
  const header = {
    alg: algorithm,
    typ: "JWT",
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));

  const signatureInput = encodedHeader + "." + encodedPayload;
  const signature = crypto
    .createHmac(algorithm, secret)
    .update(signatureInput)
    .digest("base64");
  const encodedSignature = base64urlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

const createAuthToken = (user) => {
  const payload = {
    sub: user.id,
    phone: user.phone,
    iat: Date.now(),
    exp: Date.now() + 60 * 60 * 1000, // 1 hour, in milliseconds
  };

  return generateJWT(payload);
};

const getUser = async (phone) => {
  if (!phone) return null;
  try {
    const user = await db.read("users", phone);
    return user;
  } catch (error) {
    return null;
  }
};

const isTokenRevoked = (token) => {
  if (!token) return true;

  try {
    return db.existsSync("revoked_tokens", token);
  } catch (error) {
    return true;
  }
};

const isAuthTokenValid = (token, secret = hashingSecret) => {
  // check if token is revoked
  if (isTokenRevoked(token)) return false;

  try {
    const [header, payload, signature] = token.split(".");

    // Verify token structure
    if (!header || !payload || !signature) {
      return false;
    }

    // signature check
    const decodedHeader = JSON.parse(base64urlDecode(header));
    let expectedSignature = crypto
      .createHmac(decodedHeader.alg, secret)
      .update(header + "." + payload)
      .digest("base64");

    expectedSignature = base64urlEncode(expectedSignature);
    if (signature !== expectedSignature) return false;

    // expiration check
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    console.log({ decodedPayload });
    if (decodedPayload.exp < Date.now()) return false;

    return true;
  } catch (error) {
    console.log({ error });
    return false;
  }
};

const getUserByToken = async (token) => {
  if (!token) return null;
  try {
    const [_, payload] = token.split(".");
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    const user = await db.read("users", decodedPayload.phone);
    return user;
  } catch (error) {
    return null;
  }
};

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const [_, payload] = token.split(".");
    const decodedPayload = JSON.parse(base64urlDecode(payload));
    return decodedPayload;
  } catch (error) {
    return null;
  }
};

const getTokenFromHeaders = (headers) => {
  if (!headers) return null;
  try {
    return headers.authorization.split(" ")[1];
  } catch (error) {
    return null;
  }
};

module.exports = {
  parseJSONtoObject,
  hashPassword,
  comparePassword,
  createAuthToken,
  getUser,
  isAuthTokenValid,
  getUserByToken,
  decodeToken,
  getTokenFromHeaders,
};
