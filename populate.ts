#!/usr/bin/env node

const minimist = require("minimist");

const { modlist } = require("@modwatch/core/src/__helpers__/mocks");
const fetch = require("node-fetch");

const {_: username} = minimist(process.argv.slice(2));

(async () => {
  const res = await fetch("http://localhost:3001/loadorder", {
    method: "POST",
    body: JSON.stringify({
      ...modlist,
      username: username || "Peanut",
      password: "password",
      game: "skyrim"
    })
  });
})();
