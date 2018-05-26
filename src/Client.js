"use strict";

const Endpoints = require("./Rest/Endpoints.js");
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
      disableEvents: [],
      firstShardID: 0,
      getAllMembers: false,
      guildCreateTimeout: 200,
      largeThreshold: 250,
      shardCount: "auto",
      shardSpawnTimeout: 5000,
      messageCacheLimit: 100,
      restTimeOffset: 0
    };
    for(let i in options) {
      this.options[i] = options[i];
    }
    this.RequestHandler = new RequestHandler(this);
    this.shards = new ShardManager(this);
    this.ready = false;
  }
  connect() {
    return new Promise((res, rej) => {
      this.RequestHandler.request("get", Endpoints.GATEWAY_BOT, {
        auth: true
      }).then(data => {
        if(this.options.shardCount === "auto" && !data.shards) {
          throw new Error("Failed to autoshard due to lack of data from Discord");
        }
        let shards;
        if(typeof this.options.shardCount === "number") {
          shards = this.options.shardCount + 1;
        } else if(this.options.shardCount === "auto") {
          shards = data.shards;
        } else {
          shards = 1;
        }
        if(shards !== 1) {
          this.recShard = shards;
        }
        for(let i = 0, y = this.options.firstShardID; i < shards; i++, y++) {
          y %= shards;
          setTimeout(() => {
            this.shards.spawn(data.gateway_url, y);
          }, this.options.shardSpawnTimeout*i);
        }
        data.shards = shards;
        res(data);
      }).catch(err => {
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
    if(typeof data === "string" || data instanceof String) {
      data = {
        content: data.valueOf()
      };
    }
    return new Promise((res) => {
      res("Not made yet");
    });
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
}

module.exports = Client;