"use strict";

const Base = require("./Base.js");
const Collection = require("../Util/Collection.js");
const User = require("./User.js");

class Message extends Base {
  constructor(data, client) {
    super(data.id);
    this._client = client;
    this._raw = data;
    this.content = data.content;
    this.type = data.type;
    this.tts = data.tts;
    this.timestamp = data.timestamp;
    this.editedTimestamp = data.editedTimestamp || null;
    this.mentionEveryone = data.mention_everyone;
    if(data.author) {
      this.author = this._client.users.get(data.author.id) || this._client.users.set(new User(data.author));
    } else {
      this.author = {};
    }
    this.channel = this._client.channels.get(data.channel_id);
    this.webhookID = data.webhook_id || null;
    this.deleted = false;
    this.embeds = data.embeds;
    this.attachments = data.attachments;
    this.mentions = new Collection(null, data.mentions.length);
    this.roleMentions = new Collection(null, data.mention_roles.length);
    for(const mention of data.mentions) {
      this.mentions.set(mention.id, this._client.users.get(mention.id) || this._client.users.set(new User(mention)));
    }
    for(const mention of data.mention_roles) {
      this.roleMentions.set(mention, this.channel.guild.roles.get(mention));
    }
  }
  update(data) {
    this.content = data.content;
    this.embeds = data.embeds;
    this.attachments = data.attachments;
    this.editedTimestamp = data.editedTimestamp || this.editedTimestamp;
    this.mentionEveryone = data.mention_everyone;
    return this;
  }
}

module.exports = Message;