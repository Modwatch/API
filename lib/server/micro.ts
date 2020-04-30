const { router } = require("microrouter");
const corsBuilder = require("micro-cors");
const compress = require("micro-compress");

const { routes } = require("./routes");

const cors = corsBuilder();

module.exports = cors(
  // compress(
    router(...routes)
  // )
);
