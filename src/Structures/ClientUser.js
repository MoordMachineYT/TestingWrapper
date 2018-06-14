"use strict";

const User = require("./User.js");

class ClientUser extends User {
  constructor(data, client) {
    super(data, client);
    this.email = data.email || null;
    this.verified = !!data.verified;
    this.mfa = !!data.mfa_enabled;
  }
  setPresence(data) {
    return this._client.setPresence(data);
  }
  setStatus(status) {
    return this.setPresence({ status });
  }
  setActivity(game) {
    return this.setPresence({ game });
  }
  get guilds() {
    return this._client.guilds;
  }
}

module.exports = ClientUser;
