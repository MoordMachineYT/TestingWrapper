"use strict";

const Collection = require("../Collection.js");

class ClientUserCollection extends Collection {
  constructor() {
    super(undefined, Infinity);
  }
  set(key, val) {
    if(!val) {
      throw new Error("val is falsy");
    }
    return super.set(key, val);
  }
}

module.exports = ClientUserCollection;