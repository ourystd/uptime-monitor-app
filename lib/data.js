const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const path = require("node:path");

const lib = {};
lib.baseDir = path.join(__dirname, "../.data/");

/**
 * Creates a new collection (table) and adds a
 * document (row) to it filled with data
 *
 * @param {string} colletion table
 * @param {string} document row
 * @param {any} data
 * @returns {void}
 */
lib.create = async (colletion, document, data) => {
  let filehandle;

  try {
    const collectionFolder = path.normalize(`${lib.baseDir}/.${colletion}`);
    if (!fs.existsSync(collectionFolder)) {
      fs.mkdirSync(collectionFolder, { recursive: true });
    }
    const filename = path.normalize(`${collectionFolder}/.${document}.json`);
    filehandle = await fsPromises.open(filename, "wx");
    console.log({ filename, filehandle });
    await filehandle.writeFile(JSON.stringify(data), { encoding: "utf-8" });
  } finally {
    await filehandle?.close();
  }
};

/**
 * Reads a document from a collection
 *
 * @param {string} colletion table
 * @param {string} document row
 * @returns {any}
 */
lib.read = async (colletion, document) => {
  const filename = path.normalize(
    `${lib.baseDir}/.${colletion}/.${document}.json`
  );
  if (!fs.existsSync(filename)) {
    return false;
  }
  const jsonData = await fsPromises.readFile(filename, { encoding: "utf-8" });
  return JSON.parse(jsonData);
};

/**
 * Updates a document from a collection with new data
 *
 * @param {string} colletion table
 * @param {string} document row
 * @param {any} data new data
 * @returns {any}
 */
lib.update = async (colletion, document, data) => {
  let filehandle;

  try {
    const filename = path.normalize(
      `${lib.baseDir}/.${colletion}/.${document}.json`
    );
    if (!fs.existsSync(filename)) {
      throw new Error(`${filename} does not exist`);
    }
    filehandle = await fsPromises.open(filename, "r+");
    await filehandle.truncate(); // clear the file content
    await filehandle.writeFile(JSON.stringify(data), { encoding: "utf-8" });
  } finally {
    await filehandle?.close();
  }
};

/**
 * Delete a document from a collection with new data
 *
 * @param {string} colletion table
 * @param {string} document row
 * @param {any} data new data
 * @returns {any}
 */
lib.delete = async (colletion, document) => {
  const filename = path.normalize(
    `${lib.baseDir}/.${colletion}/.${document}.json`
  );
  if (!fs.existsSync(filename)) {
    return -1;
  }
  return await fsPromises.unlink(filename);
};

module.exports = lib;
