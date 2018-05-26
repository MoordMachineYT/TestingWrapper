"use strict";

const Collection = require("../Util/Collection.js");
const Shard = require("./Shard.js");

class ShardManager extends Collection {
  constructor(client) {
    super();
    this.client = client;
    this.shard = 0;
    this.shardReady = 0;
  }
  spawn(gateway, shard) {
    this.shard++;
    if(this.has(shard)) {
      throw new Error(`Shard ${shard} already set!`);
    }
    const s = new Shard(this, shard);
    s.on("connect", id => {
      this.client.emit("shardPreReady", id);
    }).on("ready", id => {
      this.client.emit("shardReady", id);
      if(++this.shardReady === this.shard) {
        this.client.ready = true;
        this.client.emit("ready");
      }
    }).on("disconnect", id => {
      this.client.ready = false;
      this.client.emit("shardDisconnect", id);
      if(--this.shardReady === 0) {
        this.client.emit("disconnect");
      }
    }).on("error", (err, id) => {
      this.client.emit("error", err, id);
    }).on("debug", (debug, id) => {
      if(this.client.listenerCount("debug")) {
        this.client.emit("debug", debug, id);
      }
    });

    s.connect(gateway);

    this.set(shard, s);
  }
  destroy(shard) {
    this.get(shard).disconnect(false);
    this.delete(shard);
  }
  close() {
    for(let i of this.values()) {
      i.disconnect(false);
    }
    this.clear();
  }
  restart() {
    for(let i of this.values()) {
      i.disconnect(true);
    }
  }
}

module.exports = ShardManager;