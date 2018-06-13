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
    return this.client.presences.setclientpresence(data);
  }
  setStatus(status) {
    return this.setPresence({ status });
  }
  setActivity(name, { type = 0, url } = {}) {
    if (!name) return this.setPresence({ activity: null });
    return this.setPresence({
      game: { name, type, url },
    });
  }
  get guilds() {
    return this._client.guilds;
  }
}

module.exports = ClientUser;
