const http = require("node:http");
const https = require("node:https");
const url = require("node:url");
const fs = require("node:fs");
const { StringDecoder } = require("node:string_decoder");
const config = require("./lib/config");
const handlers = require("./handlers");
const { parseJSONtoObject } = require("./lib/helpers");

const mainRequestHandler = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const trimmedPathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const method = req.method.toLowerCase();
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

    console.log("handler", handlers.get(trimmedPathname));
    const responseHandler =
      handlers.get(trimmedPathname) ?? handlers.get("notFound");

    const data = {
      trimmedPathname,
      queryStringObj: query,
      method,
      headers,
      payload: parseJSONtoObject(buffer),
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

/* https
  .createServer(httpsOptions, mainRequestHandler)
  .listen(config.httpsPort, () => {
    console.log(
      `Server listening on port ${config.httpsPort} in ${config.envName} mode`
    );
  }); */
