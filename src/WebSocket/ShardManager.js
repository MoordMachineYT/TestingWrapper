"use strict";

const Collection = require("../Util/Collection.js");
const Shard = require("./Shard.js");

class ShardManager extends Collection {
  constructor(client) {
    super();
    this.client = client;
    this.shardReady = 0;
    this.lastConnect = 0;
  }
  spawn(shard) {
    const s = new Shard(this.client, shard);
    s.on("ready", () => {
      this.client.emit("shardReady", s.id);
      this.shardReady++;
      if(this.shardReady === this.size) {
        this.client.emit("ready");
      }
    }).on("disconnect", () => {
      this.shardReady--;
      this.client.emit("shardDisconnect", s.id);
      if(this.shardReady === 0) {
        this.emit("disconnect");
      }
    }).on("connect", this.client.emit.bind(this.client, "shardConnect"));
    this.set(shard, s);
    this.connect(s);
  }
  connect(shard) {
    if(Date.now() - this.lastConnect > this.client.options.shardSpawnTimeout) {
      this.lastConnect = Date.now();
      shard.connect();
    } else {
      this.tryConnect(shard);
    }
  }
  tryConnect(shard) {
    setTimeout(this.connect.bind(this, shard), this.client.options.shardSpawnTimeout);
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