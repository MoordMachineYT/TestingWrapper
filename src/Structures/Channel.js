"use strict";

const Base = require("./Base.js");

class Channel extends Base {
  constructor(data, client) {
    super(data.id);
    this._client = client;
    this.name = data.name;
    this.type = data.type;
  }
  get mention() {
    return this.toString();
  }
}

module.exports = Channel;