"use strict";

const Base = require("./Base.js");
const User = require("./User.js");

class Message extends Base {
  constructor(data, client) {
    super(data.id);
    this._client = client;
    this.content = data.content;
    if(data.author) {
      if(this._client.users.has(data.author.id)) {
        this.author = this._client.users.get(data.author.id);
      } else {
        this.author = new User(data.author);
        this._client.users.set(data.author.id, this.author);
      }
    } else {
      this.author = {};
    }
    if(this._client.channels.has(data.channel_id)) {
      this.channel = this._client.channels.get(data.channel_id);
    } else {
      this.channel = null;
    }
    this.webhookID = data.webhook_id;
    this.deleted = false;
  }
}

module.exports = Message;