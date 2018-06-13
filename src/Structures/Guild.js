"use strict";

const Base = require("./Base.js");
const { CDN } = require("../Rest/Endpoints.js");
const Collection = require("../Util/Collection.js");
const Member = require("./Member.js");
const Role = require("./Role.js");

class Guild extends Base {
  constructor(data, shard) {
    super(data.id);
    this.shard = shard;
    this._client = shard.client;
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

    this.members = new Collection();

    for(const member of data.members) {
      member.guild = this;
      this.members.set(member.user.id, new Member(member, shard.client));
    }
    
    this.channels = new Collection();
    for(const channel of data.channels) {
      if(channel.type === 0) {
        "qwerty";
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