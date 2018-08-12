"use strict";

const ClientListenerCollection = require("../Util/Collections/ClientListenerCollection.js");

class BaseClient {
  constructor() {
    this.listeners = new ClientListenerCollection();
  }
  get onDebug() {
    return this.listeners.get("debug");
  }
}

module.exports = BaseClient;