const db = require("./data");
const crypto = require("node:crypto");
const { hashPassword } = require("./helpers");

const getUser = async (phone) => {
  if (!phone) return null;
  try {
    const user = await db.read("users", phone);
    return user;
  } catch (error) {
    return null;
  }
};

const _usersHandlers = new Map();

/**
 * @typedef {Object} Payload
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} phone
 * @property {string} password
 * @property {boolean} tosAgreement
 */

/**
 * @param {Payload | null} data
 * @param {(statusCode: number, payload: any) => void} callback
 * @returns {void}
 *
 * @desc Add a new user
 */
_usersHandlers.set("post", async (data, callback) => {
  if (!data || !data.payload) {
    return callback(400, { message: "Bad request, no payload provided" });
  }
  const { firstName, lastName, phone, password, tosAgreement } = data.payload;

  if (!firstName || !lastName || !phone || !password || !tosAgreement) {
    return callback(400, { message: "Bad request, missing fields" });
  }

  const newUser = {
    firstName,
    lastName,
    phone,
    id: crypto.randomUUID(),
  };

  // user with phone already exists
  const user = await getUser(phone);
  if (user) {
    return callback(409, { message: "This phone is already in use" });
  }

  const hashedPassword = hashPassword(password);
  if (!hashedPassword) {
    return callback(500, { message: "Internal server error" });
  }

  db.create("users", newUser.phone, {
    ...newUser,
    password: hashedPassword,
  });

  callback(201, newUser);
});

_usersHandlers.set("get", async (data, callback) => {
  const { phone } = data.queryStringObj;
  const user = await getUser(phone);
  if (!user) {
    return callback(404, { message: "User not found" });
  }
  callback(200, user);
});

_usersHandlers.set("patch", async (data, callback) => {
  const { phone } = data.queryStringObj;
  const user = await getUser(phone);
  console.log({ user });
  if (!user) {
    return callback(404, { message: "User not found" });
  }

  const { firstName, lastName, password } = data.payload;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (password) user.password = hashPassword(password);

  db.update("users", phone, user);
  user.password = undefined;
  callback(200, user);
});

_usersHandlers.set("delete", async (data, callback) => {
  const { phone } = data.queryStringObj;
  const user = await getUser(phone);
  if (!user) {
    return callback(404, { message: "User not found" });
  }

  db.delete("users", phone);
  callback(200, { message: "User deleted" });
});

const handlersFn = {
  users(data, callback) {
    if (!_usersHandlers.has(data?.method)) {
      return callback(405, {
        message: `Method not allowed XXX ${data?.method}`,
      });
    }

    return _usersHandlers.get(data.method)(data, callback);
  },
  sample(data, callback) {
    callback(200, { name: "sample handler" });
  },
  ping(data, callback) {
    callback(200);
  },
  notFound(data, callback) {
    callback(404, { message: "ressouce not found" });
  },
};

const handlers = new Map();
for (const [key, value] of Object.entries(handlersFn)) {
  if (typeof value === "function") {
    handlers.set(key, value);
  }
}

console.log({ usersHandler: handlers.get("users") });

module.exports = handlers;
