"use strict";

const Base = require("./Base.js");

class UnavailableGuild extends Base {
  constructor(data) {
    super(data.id);
    this._raw = data;
    this.shard = data.shard;
    this.available = !data.unavailable;
  }
}

module.exports = UnavailableGuild;