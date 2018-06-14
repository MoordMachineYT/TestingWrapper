"use strict";

const GuildChannel = require("./GuildChannel.js");

class VoiceChannel extends GuildChannel {
  constructor(data, client) {
    super(data, client);
    this.userLimit = data.user_limit;
    this.bitrate = data.bitrate;
  }
}

module.exports = VoiceChannel;