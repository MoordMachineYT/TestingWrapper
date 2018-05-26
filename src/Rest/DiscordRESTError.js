class DiscordRESTError extends Error {
  constructor(message, type, stack) {
    super(message);
    this.name = `DiscordRESTError [${type}]`;
    if(stack) {
      this.stack = stack;
    }
  }
}

module.exports = DiscordRESTError;