"use strict";

const Collection = require("../Collection.js");

class ClientUserCollection extends Collection {
  constructor() {
    super(undefined, limit);
  }
  set(key, val) {
    if(!val) {
      throw new Error("val is falsy");
    }
  }
}