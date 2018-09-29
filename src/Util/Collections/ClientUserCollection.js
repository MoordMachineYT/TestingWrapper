"use strict";

const Collection = require("../Collection.js");

class ClientUserCollection extends Collection {
  constructor() {
    super("User", Infinity);
  }
  set(key, val) {
    if(!val && (typeof key === "string" || !key)) {
      throw new Error("val is falsy");
    }
    return super.set(key, val);
  }
}

module.exports = ClientUserCollection;