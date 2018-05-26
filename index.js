"use strict";

const Client = require("./src/Client.js");

function Plexi(options) {
  return new Client(options);
}

module.exports = Plexi;