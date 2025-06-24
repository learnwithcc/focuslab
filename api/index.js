const { createRequestHandler } = require("@remix-run/vercel");

module.exports = createRequestHandler({
  build: require("../build/server"),
  mode: process.env.NODE_ENV,
});