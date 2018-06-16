"use strict";

const MessageCollection = require("../Util/Collections/MessageCollection.js");
const GuildChannel = require("./GuildChannel.js");

class TextChannel extends GuildChannel {
  constructor(data, client) {
    super(data, client);
    this.messages = new MessageCollection(this._client, this.id, null, this._client.options.messageCacheLimit);
    this.nsfw = data.nsfw;
    this.topic = data.topic;
    this.lastMessageID = data.last_message_id;
    this.lastPinTimestamp = data.last_pin_timestamp;
  }
}

module.exports = TextChannel;