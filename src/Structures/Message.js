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
    this.pinned = data.pinned;
    this.timestamp = data.timestamp;
    this.editedTimestamp = data.editedTimestamp || null;
    this.mentionEveryone = data.mention_everyone;
    if(data.author) {
      this.sender = this._client.users.get(data.author.id) || this._client.users.set(data.author.id, new User(data.author));
    } else {
      this.sender = {};
    }
    this.channel = this._client.channels.get(data.channel_id);
    this.webhookID = data.webhook_id || null;
    this.deleted = false;
    this.embeds = data.embeds;
    this.attachments = data.attachments;
    this.getMentions(data);
    this.getChannelMentions();
  }
  update(data) {
    this.content = data.content;
    this.embeds = data.embeds;
    this.attachments = data.attachments;
    this.editedTimestamp = data.editedTimestamp || this.editedTimestamp;
    this.mentionEveryone = data.mention_everyone;
    this.getMentions(data);
    this.getChannelMentions();
    return this;
  }
  getMentions(data) {
    this.mentions = new Collection();
    this.roleMentions = new Collection();
    for(const mention of data.mentions) {
      this.mentions.set(mention.id, this._client.users.get(mention.id) || this._client.users.set(mention.id, new User(mention)));
    }
    for(const mention of data.mention_roles) {
      this.roleMentions.set(mention.id, this.channel.guild.roles.get(mention.id));
    }
  }
  getChannelMentions() {
    this.channelMentions = new Collection();
    var matches;
    if(this.content) {
      matches = this.content.match(/<#(\d{17,19})>/g);
      for(const key of matches || []) {
        if(!this.channelMentions.has(key) && this._client.channels.has(key)) {
          this.channelMentions.set(key, this._client.channels.get(key));
        }
      }
    }
  }
}

module.exports = Message;