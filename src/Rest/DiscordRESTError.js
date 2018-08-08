class DiscordRESTError extends Error {
  constructor(message, code) {
    super(message);
    this.name = `DiscordRESTError [${code}]`;
    this.code = code;
  }
  toString() {
    return `${this.name}: ${this.message}`;
  }
}

module.exports = DiscordRESTError;