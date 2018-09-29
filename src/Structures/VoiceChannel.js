"use strict";

const GuildChannel = require("./GuildChannel.js");

class VoiceChannel extends GuildChannel {
  constructor(data, client) {
    super(data, client);
    this.userLimit = data.user_limit;
    this.bitrate = data.bitrate;
  }
  async join(options = {}) {
    if(this.client.voiceConnections.has(this.guild.id)) {
      this.client.voiceConnections.leave(this.guild.id);
    }
    return this.voiceConnections.join({
      guildID: this.guild.id,
      channelID: this.id,
      mute: options.mute,
      deaf: options.deaf
    });
  }
}

module.exports = VoiceChannel;