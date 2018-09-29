"use strict";

class Base {
  constructor(id) {
    this.id = id;
  }
  get createdAt() {
    return (this.id / 4194304) + 1420070400000;
  }
  toString() {
    return `[${this.constructor.name}${this.id ? " " + this.id : ""}]`;
  }
  toJSON(s) {
    if(s) {
      return {
        id: this.id
      };
    }
    let base = {};
    for(var key in this) {
      if(!base.hasOwnProperty(key) && this.hasOwnProperty(key) && key.indexOf("_") !== 0 && key !== "client") {
        if(!this[key]) {
          base[key] = this[key];
        } else if(this[key] instanceof Set) {
          base[key] = Array.from(this[key]);
        } else if(this[key] instanceof Map) {
          base[key] = Array.from(this[key].values());
        } else if(typeof this[key].toJSON === "function") {
          base[key] = this[key].toJSON();
        } else {
          this[key] = base[key];
        }
      }
    }
    return base;
  }
}

module.exports = Base;
