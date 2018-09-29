"use strict";

const Base = require("./Base.js");
const { DefaultAvatarHashes } = require("../Util/Constants.js");
const { CDN } = require("../Rest/Endpoints.js");

class User extends Base {
  constructor(data, client) {
    super(data.id);
    this._client = client;
    this._raw = data;
    this.bot = !!data.bot;
    this.update(data);
  }
  update(data) {
    this.avatar = data.avatar || this.avatar;
    this.username = data.username || this.username;
    this.discrim = data.discriminator || this.discrim;
    return this;
  }
  send(channelID, data) {
    return this._client.sendMessage(channelID, data);
  }
  get mention() {
    return "<@" + this.id + ">";
  }
  get tag() {
    return this.username + "#" + this.discrim;
  }
  get defaultAvatar() {
    return DefaultAvatarHashes[this.discrim % DefaultAvatarHashes.length];
  }
  get defaultAvatarURL() {
    return `https://discordapp.com/assets/${this.defaultAvatar}.png`;
  }
  get avatarURL() {
    return this.avatar ? `${CDN}/avatars/${this.id}/${this.avatar}.${this.avatar.startsWith("a_") ? "gif" : "png"}` : this.defaultAvatarURL;
  }
  get guilds() {
    return this._client.guilds.filter(g => g.members.has(this.id));
  }
}

module.exports = User;
