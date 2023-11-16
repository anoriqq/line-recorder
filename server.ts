import { createRequestHandler } from "@remix-run/express";
import express from "express";
import https from "https";
import fs from 'fs'

// notice that the result of `remix build` is "just a module"
import * as build from "./build/index.js";
import { broadcastDevReady } from "@remix-run/node";

const app = express();
app.use(express.static("public"));

// and your app is "just a request handler"
app.all("*", createRequestHandler({ build }));


const  opts  = {
  key: fs.readFileSync('cert/localhost/key.pem'),
  cert: fs.readFileSync('cert/localhost/cert.pem'),
}
const server = https.createServer(opts, app)
server.listen(3000, () => {
  if (process.env.NODE_ENV === "development") {
    broadcastDevReady(build)
  }
  console.log("App listening on http://localhost:3000");
});
