"use strict";

const CategoryChannel = require("./Structures/CategoryChannel.js");
const ClientChannelCollection = require("./Util/Collections/ClientChannelCollection.js");
const ClientGuildCollection = require("./Util/Collections/ClientGuildCollection.js");
const ClientUserCollection = require("./Util/Collections/ClientUserCollection.js");
const Collection = require("./Util/Collection.js");
const Endpoints = require("./Rest/Endpoints.js");
const Message = require("./Structures/Message.js");
const RequestHandler = require("./Rest/RequestHandler.js");
const ShardManager = require("./WebSocket/ShardManager.js");
const TextChannel = require("./Structures/TextChannel.js");
const VoiceChannel = require("./Structures/VoiceChannel.js");

let EventEmitter = require("events").EventEmitter;

try {
  EventEmitter = require("eventemitter16");
} catch(err) {} // eslint-disable-line no-empty

class Client extends EventEmitter {
  constructor(options) {
    super();
    this.options = Object.assign({
      presence: {
        status: "online",
        afk: false,
        game: null
      },
      disableEveryone: true,
      disableEvents: [],
      firstShardID: 0,
      lastShardID: 0,
      getAllMembers: false,
      guildCreateTimeout: 200,
      largeThreshold: 250,
      shardCount: "auto",
      shardSpawnTimeout: 5000,
      messageCacheLimit: 100,
      restTimeOffset: 0,
      ws: {},
      voiceConnectionTimeout: 30000
    }, options);
    this.options.shardSpawnTimeout = Math.max(this.options.shardSpawnTimeout, 5000); // Must be at least 5000
    this.requestHandler = new RequestHandler(this);
    this.shards = new ShardManager(this);
    this.ready = false;
    this.guilds = new ClientGuildCollection(this);
    this.users = new ClientUserCollection();
    this.channels = new ClientChannelCollection(this);
    this.attempts = 1;
    this.guildShardMap = {};
  }
  async connect() {
    try {
      const data = await this.requestHandler.request("GET", Endpoints.GATEWAY_BOT, {
        auth: true
      });
      if(this.options.shardCount === "auto" && !data.shards) {
        return new Error("Failed to autoshard due to lack of data from Discord");
      }
      if(this.options.shardCount === "auto") {
        this.options.shardCount = data.shards;
      }
      if(this.options.shardCount < data.shards) {
        this.emit("debug", `Connecting to Discord with ${this.options.shardCount} shards, however ${data.shards} is recommended`);
      }
      this.gatewayURL = data.url;
      for(let i = this.options.firstShardID || 0; i < (this.options.lastShardID || data.shards); i++) {
        this.shards.spawn(i);
      }
    } catch(err) {
      if(this.tryReconnect && this.attempts++ !== 5) {
        this.emit("error", err);
        return this.connect();
      }
      return err;
    }
  }
  disconnect(reconnect) {
    return new Promise((res) => {
      if(reconnect) {
        this.shards.restart();
      } else {
        this.shards.close();
      }
      res();
    });
  }
  sendMessage(channelID, data) {
    if(typeof data === "string" || data instanceof String || !data) {
      data = {
        content: "" + data
      };
    }
    if(channelID.id) {
      channelID = channelID.id;
    }
    const noEveryone = data.disableEveryone instanceof Boolean ? data.disableEveryone : !!this.options.disableEveryone;
    if(noEveryone) {
      if(data.content) {
        data.content = data.content.replace(/@everyone/g, "@\u200beveryone").replace(/@here/g, "@\u200bhere");
      }
    }
    return this.requestHandler.request("post", Endpoints.CHANNEL_MESSAGES(channelID), {
      auth: true,
      files: data.files || [data.file],
      data
    }).then((msg) => new Message(msg, this));
  }
  updateStatus(data) {
    if(!data.status) {
      data.status = this.user.status;
    }
    if(!data.game) {
      data.game = null;
    }
    this.shards.forEach(shard => {
      shard.updateStatus(data);
    });
    return Promise.resolve(data);
  }
  deleteMessage(channelID, message) {
    if(channelID.id) {
      channelID = channelID.id;
    }
    if(message.id) {
      message = message.id;
    }
    return this.requestHandler.request("delete", Endpoints.CHANNEL_MESSAGE(channelID, message), {
      auth: true
    }).then((msg) => {
      msg = this.channels.get(channelID).messages.get(msg.id);
      if(!msg) {
        return null;
      }
      msg.deleted = true;
      return msg;
    });
  }
  deleteMessages(channelID, messages) {
    if(channelID.id) {
      channelID = channelID.id;
    }
    if(Array.isArray(messages)) {
      messages = messages.map(msg => msg.id || msg);
    }
    if(messages instanceof Collection) {
      messages = messages.keyArray;
    }
    if(messages.length > 100) {
      return this.requestHandler.request("post", Endpoints.CHANNEL_BULK_DELETE(channelID), {
        auth: true,
        data: {
          messages: messages.splice(0, 100)
        }
      }).then(() => this.deleteMessages(channelID, messages));
    }
    return new Promise((res, rej) => {
      this.requestHandler.request("post", Endpoints.CHANNEL_BULK_DELETE(channelID), {
        auth: true,
        data: { messages }
      }).then(() => res()).catch((err) => rej(err));
    });
  }
  getGuildChannels(guild) {
    guild = guild.id || guild;
    return this.requestHandler.request("get", Endpoints.GUILD_CHANNELS(guild), {
      auth: true
    }).then(channels => channels.map(channel => {
      if(channel.type === 0) {
        return new TextChannel(channel, this);
      }
      if(channel.type === 2) {
        return new VoiceChannel(channel, this);
      }
      return new CategoryChannel(channel, this);
    }));
  }
  get uptime() {
    return this.ready ? Date.now() - this.startTime : 0;
  }
}

module.exports = Client;
