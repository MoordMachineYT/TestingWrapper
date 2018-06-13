const Collection = require("../Collection.js");
const Endpoints = require("../../Rest/Endpoints.js");

class MessageCollection extends Collection {
  constructor(client, base, limit) {
    super(base, limit);
    this._client = client;
  }
  set(key, val) {
    if(this.size >= this.limit) {
      this.delete(this.firstKey);
    }
    return super.set(key, val);
  }
  fetch(id) {
    if(this.has(id)) {
      return this.get(id);
    }
    this._client.RequestHandler.request("get", Endpoints.CHANNEL_MESSAGE, {
      auth: true
    });
  }
}

module.exports = MessageCollection;