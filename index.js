const http = require("node:http");
const https = require("node:https");
const url = require("node:url");
const fs = require("node:fs");
const { StringDecoder } = require("node:string_decoder");
const config = require("./config");

const handlers = {
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

const mainRequestHandler = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const trimmedPathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const method = req.method.toUpperCase();
  const { query } = parsedUrl;
  const headers = req.headers;

  // get the payload, if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", function listener(data) {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();
    console.log({ trimmedPathname, method, query, headers, buffer });

    const responseHandler =
      typeof handlers[trimmedPathname] === "undefined"
        ? handlers.notFound
        : handlers[trimmedPathname];

    const data = {
      trimmedPathname,
      queryStringObj: query,
      method,
      headers,
      payload: buffer,
    };

    responseHandler(data, (statusCode = 200, payload = {}) => {
      const payloadString = JSON.stringify(payload);

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log(`returnded res: ${statusCode}`, payloadString);
    });

    // res.end(JSON.stringify(parsedUrl, null, 2));
  });
};

http.createServer(mainRequestHandler).listen(config.httpPort, () => {
  console.log(
    `Server listening on port ${config.httpPort} in ${config.envName} mode`
  );
});

const httpsOptions = {
  cert: fs.readFileSync("./https/cert.pem"),
  key: fs.readFileSync("./https/key.pem"),
};

https
  .createServer(httpsOptions, mainRequestHandler)
  .listen(config.httpsPort, () => {
    console.log(
      `Server listening on port ${config.httpsPort} in ${config.envName} mode`
    );
  });
