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
    } else {
      client.users.set(this.id, new User(data.user));
      this.user = client.users.get(this.id);
    }
    this.guild = data.guild || client.guilds.get(data.guild_id);
    if(!this.guild) {
      throw new Error("member object created but corresponding guild not found");
    }
    this.permission = new Permissions(this.calculateBasePermissions(data.roles));
    this.roles = data.roles.map(r => this.guild.roles.get(r));
  }
  update(data) {
    this.user.update(data.user);
    this.permission = new Permissions(this.calculateBasePermissions(data.roles));
    this.roles = data.roles.map(r => this.guild.roles.get(r));
  }
  calculateBasePermissions(roles) {
    let permissions = 0;
    for(let role of roles) {
      role = this.guild.roles.get(role);
      permissions |= role.permissions;
    }
    if(permissions & 8 === 8) {
      permissions = 0b1111111111101111111110011111111;
    }
    return permissions;
  }
  get username() {
    return this.user.username;
  }
}

module.exports = Member;