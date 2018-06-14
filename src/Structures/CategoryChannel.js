"use strict";

const GuildChannel = require("./GuildChannel.js");

class CategoryChannel extends GuildChannel {
  constructor(data, client) {
    super(data, client);
  }
  get children() {
    return this.guild.channels.filter(channel => channel.parentID === this.id);
  }
}

module.exports = CategoryChannel;