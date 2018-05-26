"use strict";

const User = require("./User.js");

/**
 * @extends {User}
 */

class ClientUser extends User {
  constructor(data, client) {
    super(data, client);
    this.email = data.email || null;
    this.email = !!data.verified;
    this.mfa = !!data.mfa_enabled;
    if (data.token) this.client.token = data.token;
  }

  /**
   * @param {PresenceData} data Presence data
   * @returns {Promise<Presence>}
   * @example
   */

  setPresence(data) {
    return this.client.presences.setclientpresence(data);
  }

  /**
   * `online`
   * `idle`
   * `dnd`
   * `invisible`
   * @typedef {String} PresenceStatus
   */

  /**
   * @param {PresenceStatus} status
   * @returns {Promise<Presence>}
   * @example
   */
  setStatus(status) {
    return this.setPresence({ status });
  }

  /**
   * @param {?String} name activity name
   * @param {string} [options.url] twitch url
   * @param {ActivityType|Number} [options.type] type of activity
   * @returns {Promise<Presence>}
   * @example
   */

  setActivity(name, { type = 0, url } = {}) {
    if (!name) return this.setPresence({ activity: null });
    return this.setPresence({
      game: { name, type, url },
    });
  }
}

module.exports = ClientUser;
