"use strict";

const Collection = require("../Collection.js");

class ClientGuildCollection extends Collection {
  constructor(client) {
    super("Guild", Infinity);
    this._client = client;
  }
  delete(key) {
    const val = this.get(key);
    if(!val) {
      return val;
    }
    for(const channel of val.channels) {
      this._client.channels.delete(channel.id);
    }
    return super.delete(key);
  }
}

module.exports = ClientGuildCollection;