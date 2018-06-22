"use strict";

const Base = require("./Base.js");
const Collection = require("../Util/Collection.js");
const Member = require("./Member.js");
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
    this.member = this.channel.guild && this.sender.id ? this.channel.guild.member(this.sender.id) || this.channel.guild.members.set(this.sender.id, new Member(data.member, this._client)) : null;
    this.webhookID = data.webhook_id || null;
    this.deleted = false;
    this.embeds = data.embeds;
    this.attachments = data.attachments;
    this.getMentions(data);
    this.getChannelMentions();
  }
  update(data) {
    this.content = data.hasOwnProperty("content") ? data.content : this.content;
    this.embeds = data.hasOwnProperty("embeds") ? data.embeds : this.embeds;
    this.attachments = data.hasOwnProperty("attachments") ? data.attachments : this.attachments;
    this.editedTimestamp = data.editedTimestamp || this.editedTimestamp;
    this.mentionEveryone = data.hasOwnProperty("mention_everyone") ? data.mention_everyone : this.mentionEveryone;
    this.getMentions(data);
    this.getChannelMentions();
    return this;
  }
  getMentions(data) {
    if(!data.mentions) {
      return this.getRoleMentions(data);
    }
    this.mentions = new Collection();
    for(const mention of data.mentions) {
      this.mentions.set(mention.id, this._client.users.get(mention.id) || this._client.users.set(mention.id, new User(mention)));
    }
    this.getRoleMentions(data);
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
  getRoleMentions(data) {
    if(!data.mention_roles) {
      return;
    }
    this.roleMentions = new Collection();
    for(const mention of data.mention_roles) {
      this.roleMentions.set(mention.id, this.channel.guild.roles.get(mention.id));
    }
  }
}

module.exports = Message;