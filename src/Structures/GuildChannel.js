"use strict";

const Channel = require("./Channel.js");

class GuildChannel extends Channel {
  constructor(data, client) {
    super(data, client);
    this.guild = this._client.guilds.get(data.guild_id);
    if(!this.guild) {
      throw new Error("GuildChannel created but guild not found");
    }
    this.position = data.position;
    this.parentID = data.parent_id;
  }
}

module.exports = GuildChannel;