const Channel = require("./Channel.js");

class GuildChannel extends Channel {
  constructor(data, client) {
    super(data, client);

  }
}

module.exports = GuildChannel;