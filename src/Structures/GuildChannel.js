"use strict";

const Channel = require("./Channel.js");

class GuildChannel extends Channel {
  constructor(data, client) {
    super(data, client);
    this.guildID = data.guild_id;
    this.position = data.position;
    this.parentID = data.parent_id;
  }
  get guild() {
    return this._client.guilds.get(this.guildID);
  }
}

module.exports = GuildChannel;