"use strict";

const Collection = require("../Collection.js");

class ClientChannelCollection extends Collection {
  constructor(client) {
    super("Channel", Infinity);
    this._client = client;
  }
  set(key, val) {
    if(this.has(key) && val.guild) {
      val.guild.channels.set(key, val);
    }
    return super.set(key, val);
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