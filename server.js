#!/usr/bin/env node
const micro = require("micro");
const app = require("./dist/server/micro");
const config = {
  expressSecret: process.env.DBEXPRESSSECRET,
  jwtSecret: process.env.JWTSECRET,
  ip: process.env.IP || "0.0.0.0",
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "local"
};

micro(app).listen(config.port, config.ip, () => {
  console.log(`Started Server at ${config.ip}:${config.port}`);
});
