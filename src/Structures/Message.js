"use strict";

const Base = require("./Base.js");
const Collection = require("../Util/Collection.js");
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
    this.channel = this._client.channels.get(data.channel_id);
    this.webhookID = data.webhook_id || null;
    this.deleted = false;
    this.embeds = data.embeds;
    this.attachments = data.attachments;
    this.mentions = new Collection();
    for(const mention of data.mentions) {
      this.mentions.set(mention.id, this._client.users.get(mention.id) || this._client.users.set(new User(mention)));
    }
  }
  update(data) {
    this.content = data.content;
    return this;
  }
}

module.exports = Message;