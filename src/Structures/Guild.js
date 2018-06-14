"use strict";

const Base = require("./Base.js");
const CategoryChannel = require("./CategoryChannel.js");
const { CDN } = require("../Rest/Endpoints.js");
const Collection = require("../Util/Collection.js");
const Message = require("./Message.js");
const Member = require("./Member.js");
const Role = require("./Role.js");
const User = require("./User.js");
const VoiceChannel = require("./VoiceChannel.js");
const TextChannel = require("./TextChannel.js");

class Guild extends Base {
  constructor(data, shard) {
    super(data.id);
    this.shard = shard;
    this._client = shard.client;
    this._raw = data;
    this.name = data.name;
    this.icon = data.icon || null;
    this.splash = data.splash || null;
    this.ownerID = data.owner_id;
    this.region = data.region;
    this.afkTimeout = data.afk_timeout;
    this.verification = data.verification_level;
    this.messageNotifications = data.default_message_notifications;
    this.large = data.large;
    this.mfaLevel = data.mfa_level;
    this.available = !data.unavailable;
    this.memberCount = data.member_count;
    this.joinedAt = Date.parse(data.joined_at);
    this.features = data.features;
    this.roles = new Collection();

    for(const r of data.roles) {
      r.guild = this;
      this.roles.set(r.id, new Role(r));
    }

    this._roles = Array.from(this.roles.keys());

    this.members = new Collection();

    for(const member of data.members) {
      member.guild = this;
      this.members.set(member.user.id, new Member(member, shard.client));
    }
    
    this.channels = new Collection();
    for(const channel of data.channels) {
      if(channel.type === 0) {
        this._client.channels.set(channel.id, this.channels.set(channel.id, new TextChannel(channel, this._client)));
      } else if(channel.type === 2) {
        this._client.channels.set(channel.id, this.channels.set(channel.id, new VoiceChannel(channel, this._client)));
      } else if(channel.type === 4) {
        this._client.channels.set(channel.id, this.channels.set(channel.id, new CategoryChannel(channel, this._client)));
      } else {
        throw new Error("Non-guild channel found in guild");
      }
    }
  }
  update(data) {
    this.ownerID = data.owner_id;
    this.features = data.features;
    this.available = !data.unavailable;
    this.large = data.large;
    for(const member of data.members) {
      this.members.get(member.user.id).update(member);
    }
  }
  member(resolvable) {
    if(resolvable instanceof Message) {
      return this.members.get(resolvable.author.id);
    }
    if(resolvable instanceof Member || resolvable instanceof User) {
      return this.members.get(resolvable.id);
    }
    if(resolvable) {
      return this.members.get(resolvable);
    }
    return this.owner;
  }
  get owner() {
    return this.members.get(this.ownerID);
  }
  get iconURL() {
    return this.icon ? `${CDN}/icons/${this.id}/${this.icon}/${this.client.options.defaultImageFormat}/?size=${this.client.options.defaultImageSize}` : null;
  }
  get splashURL() {
    return this.splash ? `${CDN}/splashes/${this.id}/${this.splash}.jpg` : null;
  }
}

module.exports = Guild;