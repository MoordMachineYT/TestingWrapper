"use strict";

const Channel = require("./Channel.js");
const User = require("./User.js");

class DMChannel extends Channel {
  constructor(data, client) {
    super(data, client);
    this.ownerID = data.owner_id;
    this.lastPinTimestamp = data.last_pin_timestamp || null;
    this.recipient = this._client.users.get(data.recipient[0].id) || this._client.users.set(data.recipient[0].id, new User(data.recipient[0]));
  }
  get owner() {
    return this._client.users.get(this.ownerID) || null;
  }
}

module.exports = DMChannel;