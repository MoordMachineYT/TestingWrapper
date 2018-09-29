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
    const s = new Shard(this.client);
    this.set(shard, s);
    this.connect(shard);
  }
  connect(shard) {
    if(Date.now() - this.lastConnect > this.client.options.shardSpawnTimeout) {
      this.lastConnect = Date.now();
      this.get(shard).connect();
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