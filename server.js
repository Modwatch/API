#!/usr/bin/env node
const micro = require("micro");
const app = require("./dist/server/micro");

const port = process.env.PORT || 3001;
const ip = process.env.IP || "0.0.0.0";

micro(app).listen(
  port,
  ip,
  () => {
    console.log(`Started Server at ${ip}:${port}`);
  }
);
