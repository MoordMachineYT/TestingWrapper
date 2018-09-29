"use strict";

const Base = require("./Base.js");
const CategoryChannel = require("./CategoryChannel.js");
const { CDN } = require("../Rest/Endpoints.js");
const Collection = require("../Util/Collection.js");
const Member = require("./Member.js");
const Role = require("./Role.js");
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
    this.lazy = data.lazy;
    this.explicitContentFilter = data.explicit_content_filter;
    this.mfaLevel = data.mfa_level;
    this.available = !data.unavailable;
    this.memberCount = data.member_count;
    this.joinedAt = Date.parse(data.joined_at);
    this.features = data.features;
    this.roles = new Collection("Role");

    for(const r of data.roles) {
      r.guild = this;
      this.roles.set(r.id, new Role(r));
    }

    this.members = new Collection("Member");

    for(const member of data.members) {
      member.guild = this;
      this.members.set(member.user.id, new Member(member, shard.client));
    }
    
    this.channels = new Collection("GuildChannel");
    for(const channel of data.channels) {
      if(channel.type === 0) {
        this._client.channels.set(channel.id, this.channels.set(channel.id, new TextChannel(channel, this)));
      } else if(channel.type === 2) {
        this._client.channels.set(channel.id, this.channels.set(channel.id, new VoiceChannel(channel, this)));
      } else if(channel.type === 4) {
        this._client.channels.set(channel.id, this.channels.set(channel.id, new CategoryChannel(channel, this)));
      } else {
        throw new Error("Non-guild channel found in guild");
      }
    }
  }
  update(data) {
    this.ownerID = data.owner_id || this.ownerID;
    this.features = data.features || this.features;
    this.available = !data.unavailable;
    this.lazy = data.hasOwnProperty("lazy") ? data.lazy : this.lazy;
    this.large = data.hasOwnProperty("large") ? data.large : this.large;
    this.explicit_content_filter = data.hasOwnProperty("explicit_content_filter") ? data.explicit_content_filter : this.explicitContentFilter;
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