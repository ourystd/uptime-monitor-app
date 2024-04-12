const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const trimmedPathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");

  console.log({ trimmedPathname });
  res.end(JSON.stringify(parsedUrl, null, 2));
});

const port = 4000;

server.listen(port, () => {
  console.log("Server listening on port 3000");
});
