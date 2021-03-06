"use strict";

const Base = require("./Base.js");
const { ChannelType } = require("../Util/Constants.js");

class Channel extends Base {
  constructor(data, client) {
    super(data.id);
    this._client = client;
    this._raw = data;
    this.name = data.name;
    this.type = ChannelType[data.type];
  }
  get mention() {
    return this.toString();
  }
}

module.exports = Channel;