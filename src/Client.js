"use strict";

const ClientChannelCollection = require("./Util/Collections/ClientChannelCollection.js");
const ClientGuildCollection = require("./Util/Collections/ClientGuildCollection.js");
const ClientUserCollection = require("./Util/Collections/ClientUserCollection.js");
const Collection = require("./Util/Collection.js");
const Endpoints = require("./Rest/Endpoints.js");
const Message = require("./Structures/Message.js");
const RequestHandler = require("./Rest/RequestHandler.js");
const ShardManager = require("./WebSocket/ShardManager.js");


let EventEmitter = require("events").EventEmitter;

try {
  EventEmitter = require("eventemitter16");
} catch(err) { // eslint-disable-line no-empty
}

class Client extends EventEmitter {
  constructor(options) {
    super();
    this.token = options.token;
    this.options = {
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
      ws: {}
    };
    for(const i in options) {
      this.options[i] = options[i];
    }
    this.options.shardSpawnTimeout = Math.max(this.options.shardSpawnTimeout, 5000); // Must be at least 5000
    this.RequestHandler = new RequestHandler(this);
    this.shards = new ShardManager(this);
    this.ready = false;
    this.guilds = new ClientGuildCollection(this);
    this.users = new ClientUserCollection();
    this.channels = new ClientChannelCollection(this);
  }
  connect() {
    return new Promise((res, rej) => {
      this.RequestHandler.request("get", Endpoints.GATEWAY_BOT, {
        auth: true
      }).then((data) => {
        if(this.options.shardCount === "auto" && !data.shards) {
          throw new Error("Failed to autoshard due to lack of data from Discord");
        }
        let shards;
        if(typeof this.options.shardCount === "number") {
          shards = this.options.shardCount;
        } else if(this.options.shardCount === "auto") {
          shards = data.shards;
        } else {
          shards = 1;
        }
        if(shards !== 1) {
          this.recShard = shards;
        }
        for(let i = this.options.firstShardID || 0; i < (this.options.lastShardID || shards); i++) {
          setTimeout(() => {
            this.shards.spawn(data.gateway_url, i);
          }, this.options.shardSpawnTimeout*i);
        }
        data.shards = shards;
        res(data);
      }).catch((err) => {
        rej(err);
      });
    });
  }
  disconnect(bool) {
    return new Promise((res) => {
      bool ? this.shards.restart() : this.shards.close();
      res(this);
    });
  }
  send(channelID, data) {
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
    return new Promise((res, rej) => {
      this.RequestHandler.request("post", Endpoints.CHANNEL_MESSAGES(channelID), {
        auth: true,
        data
      }).then((msg) => {
        res(new Message(msg, this));
      }).catch((err) => {
        rej(err);
      });
    });
  }
  sendMessage(channelID, content) {
    return this.send(channelID, { content });
  }
  sendCodeBlock(channelID, content, language) {
    return this.send(channelID, { content: `\`\`\`${language || "js"}\n${content}\n\`\`\``});
  }
  sendEmbed(channelID, embed) {
    return this.send(channelID, { embed });
  }
  setPresence(data) {
    if(!data.status) {
      data.status = this.user.status;
    }
    if(!data.game) {
      data.game = null;
    }
    this.shards.forEach(shard => {
      shard.setPresence(data);
    });
    Promise.resolve(data);
  }
  deleteMessage(channelID, message) {
    if(channelID.id) {
      channelID = channelID.id;
    }
    if(message.id) {
      message = message.id;
    }
    return new Promise((res, rej) => {
      this.RequestHandler.request("delete", Endpoints.CHANNEL_MESSAGE(channelID, message), {
        auth: true
      }).then((msg) => {
        msg = this.channels.get(channelID).messages.get(msg.id);
        if(!msg) {
          res(null);
        }
        msg.deleted = true;
        res(msg);
      }).catch((err) => {
        rej(err);
      });
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
      return this.RequestHandler.request("delete", Endpoints.CHANNEL_BULK_DELETE(channelID), {
        auth: true,
        data: {
          messages: messages.splice(0, 100)
        }
      }).then(() => this.deleteMessages(channelID, messages));
    }
    return new Promise((res, rej) => {
      this.RequestHandler.request("delete", Endpoints.CHANNEL_BULK_DELETE(channelID), {
        auth: true,
        data: { messages }
      }).then(() => res()).catch((err) => rej(err));
    });
  }
  get uptime() {
    return this.ready ? Date.now() - this.startTime : 0;
  }
}

module.exports = Client;