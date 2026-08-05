/**
 * cPanel Node.js Selector / Passenger startup file.
 * Set Application startup file to: server.js
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

process.env.NODE_ENV = "production";

const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({
  dev: false,
  hostname,
  port,
  dir: __dirname,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`Ready on http://${hostname}:${port}`);
  });
});
