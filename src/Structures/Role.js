"use strict";

const Base = require("./Base.js");

class Role extends Base {
  constructor(data) {
    super(data.id);
    this._raw = data;
    this.name = data.name;
    this.color = data.color;
    this.hoist = data.hoist;
    this.position = data.position;
    this.managed = data.managed;
    this.mentionable = data.mentionable;
    this.guild = data.guild;
    this.permissions = data.permissions;
  }
  update(data) {
    this.name = data.name;
    this.color = data.color;
    this.hoist = data.hoist;
    this.position = data.position;
    this.managed = data.managed;
    this.mentionable = data.mentionable;
    this.permissions = data.permissions;
  }
  delete(reason) {
    return this.guild.deleteRole(this.id, reason);
  }
  edit(options, reason) {
    return this.guild.editRole(this.id, options, reason);
  }
  get mention() {
    return this.toString();
  }
  get members() {
    return this.guild.members.filter(m => m.roles.has(this.id));
  }
}

module.exports = Role;