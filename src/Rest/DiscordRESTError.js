"use strict";

class DiscordRESTError extends Error {
  constructor(message, code, stack) {
    super(message);
    this.name = `DiscordRESTError[${code}]`;
    this.code = code;
    if(stack) {
      this.stack = stack.replace(/\w*?Error/, `${this.name}: ${this.message}`);
    }
  }
  toString() {
    return `${this.name}: ${this.message}`;
  }
}

module.exports = DiscordRESTError;