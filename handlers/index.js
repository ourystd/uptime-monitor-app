const users = require("./users");
const tokens = require("./tokens");

const handlersFn = {
  users,
  tokens,
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
