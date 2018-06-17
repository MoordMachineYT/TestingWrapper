"use strict";

const Collection = require("../Collection.js");

class ClientChannelCollection extends Collection {
  constructor(client) {
    super(null, Infinity);
    this._client = client;
  }
  set(key, val) {
    if(val.guild) {
      val.guild.channels.set(key, val);
    }
    super.set(key, val);
  }
  delete(key) {
    const val = this.get(key);
    if(!val) {
      return val;
    }
    if(val.guild && val.guild.channels.has(key)) {
      val.guild.channels.delete(key);
    }
    return super.delete(key);
  }
}

module.exports = ClientChannelCollection;