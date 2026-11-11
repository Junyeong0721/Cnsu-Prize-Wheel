import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const html = await readFile("dist/index.html");
const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
});
server.listen(5180, "127.0.0.1", () =>
  console.log("Local: http://127.0.0.1:5180/"),
);
