"use strict";

const Channel = require("./Channel.js");

class GuildChannel extends Channel {
  constructor(data, guild) {
    if(!guild) {
      throw new Error("GuildChannel creates but guild not found");
    }
    super(data, guild.shard.client);
    this._client = guild.shard.client;
    this.position = data.position;
    this.parentID = data.parent_id || null;
    this.guild = guild;
  }
}

module.exports = GuildChannel;