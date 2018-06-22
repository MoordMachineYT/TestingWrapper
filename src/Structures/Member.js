"use strict";

const Base = require("./Base.js");
const Permissions = require("../Util/Permissions.js");
const User = require("./User.js");

class Member extends Base {
  constructor(data, client) {
    const user = data.user;
    if(!user) {
      throw new Error("Member object created but corresponding user not found");
    }
    super(user.id);
    this._raw = data;
    this._client = client;
    if(this.id === client.user.id) {
      this.user = client.user;
    } else if(client.users.has(this.id)) {
      this.user = client.users.get(this.id).update(user);
      client.users.set(this.id, this.user);
    } else {
      client.users.set(this.id, new User(user, this._client));
      this.user = client.users.get(this.id);
    }
    this.guild = data.guild || client.guilds.get(data.guild_id);
    if(!this.guild) {
      throw new Error("member object created but corresponding guild not found");
    }
    this.roles = data.roles.map(r => this.guild.roles.get(r));
  }
  update(data) {
    this.user.update(data.user);
    this.roles = data.roles.map(r => this.guild.roles.get(r));
  }
  get username() {
    return this.user.username;
  }
  get permission() {
    return new Permissions(this.roles.reduce((acc, val) => acc | val.permissions, 0));
  }
}

module.exports = Member;