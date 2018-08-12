"use strict";

const Collection = require("../Collection.js");

class ClientListenerCollection extends Collection {
  constructor() {
    super("Function", Infinity);
  }
  set(event, listener) {
    if(this.has(event)) {
      throw new Error("Already listening to event " + event);
    }
    if(typeof listener !== "function") {
      throw new Error("listener argument must be of type function");
    }
    super.set(event, listener);
  }
}

module.exports = ClientListenerCollection;