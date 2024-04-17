const http = require("node:http");
const url = require("node:url");
const { StringDecoder } = require("node:string_decoder");

const handlers = {
  sample(data, callback) {
    callback(200, { name: "sample handler" });
  },
  notFound(data, callback) {
    callback(404, { message: "ressouce not found" });
  },
};

const server = http.createServer((req, res) => {
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
});

const port = 4000;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
