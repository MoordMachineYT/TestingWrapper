// Heavily inspired by Discord.js

"use strict";

const { GATEWAY_URL, GATEWAY_VERSION } = require("../Constants.js");
let Erlpack;

try {
  Erlpack = require("erlpack");
} catch(err) { // eslint-disable-line no-empty
}
try {
  exports.WebSocket = require("uws");
} catch(err) {
  exports.WebSocket = require("ws");
}
exports.pack = function(data) {
  if(Erlpack) {
    return Erlpack.pack(data);
  }
  return JSON.stringify(data);
};
exports.unpack = function(data) {
  if(!Erlpack || data[0] === "{") {
    return JSON.parse(data.toString());
  }
  if(!(data instanceof Buffer)) data = Buffer.from(new Uint8Array(data));
  return Erlpack.unpack(data);
};
exports.create = function(gateway = "", encoding) {
  let [g, e] = gateway.split("?");
  if(!g) {
    g = GATEWAY_URL;
  }
  let ws;
  if(!e) {
    ws = new exports.WebSocket(`${g}?v=${GATEWAY_VERSION}&encoding=${encoding || (Erlpack ? "etf" : "json")}&compress=zlib-stream`);
  } else {
    ws = new exports.WebSocket(`${g}?${e}`);
  }
  return ws;
};
