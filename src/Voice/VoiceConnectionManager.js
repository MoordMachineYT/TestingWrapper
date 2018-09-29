"use strict";

const Collection = require("../Util/Collection.js");
const VoiceConnection = require("./VoiceConnection.js");

class VoiceConnectionManager extends Collection {
  constructor(client) {
    super("VoiceConnection");
    this.client = client;
  }
  join(options) {
    return new Promise((res, rej) => {
      if(this.client.guildShardMap[options.guildID] === undefined) {
        rej(new Error("Guild not found"));
      }
      this.client.shards.get(this.client.guildShardMap[options.guildID]).updateVoiceStatus({
        guild_id: options.guildID,
        channel_id: options.channelID,
        self_mute: !!options.mute,
        self_deaf: !!options.deaf
      });
      res(new VoiceConnection(this.client.shards.get(this.client.guildShardMap[options.guildID]), options));
    });
  }
  leave(guildID) {
    if(this.has(guildID)) {
      this.get(guildID).disconnect();
      this.delete(guildID);
    }
  }
}

module.exports = VoiceConnectionManager;