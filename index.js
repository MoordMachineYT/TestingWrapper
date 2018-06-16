"use strict";

const Client = require("./src/Client.js");
const extend = require("./src/Util/Extend.js");

function Plexi(options) {
  extend();
  return new Client(options);
}
Plexi.Base = require("./src/Structures/Base.js");
Plexi.CategoryChannel = require("./src/Structures/CategoryChannel.js");
Plexi.Channel = require("./src/Structures/Channel.js");
Plexi.Client = Client;
Plexi.ClientUser = require("./src/Structures/ClientUser.js");
Plexi.Collection = require("./src/Util/Collection.js");
Plexi.Constants = require("./src/Constants.js");
Plexi.DMChannel = require("./src/Structures/DMChannel.js");
Plexi.Guild = require("./src/Structures/Guild.js");
Plexi.GuildChannel = require("./src/Structures/GuildChannel.js");
Plexi.Limiter = require("./src/Util/Limiter.js");
Plexi.Member = require("./src/Structures/Member.js");
Plexi.Message = require("./src/Structures/Message.js");
Plexi.MessageCollection = require("./src/Util/Collections/MessageCollection.js");
Plexi.Permissions = require("./src/Util/Permissions.js");
Plexi.Request = require("./src/Rest/Request.js");
Plexi.RequestHandler = require("./src/Rest/RequestHandler.js");
Plexi.Role = require("./src/Structures/Role.js");
Plexi.Shard = require("./src/WebSocket/Shard.js");
Plexi.ShardManager = require("./src/WebSocket/ShardManager.js");
Plexi.TextChannel = require("./src/Structures/TextChannel.js");
Plexi.User = require("./src/Structures/User.js");
Plexi.VoiceChannel = require("./src/Structures/VoiceChannel.js");

Object.keys(Plexi).filter(key => Plexi.hasOwnProperty(key) && typeof Plexi[key] === "function" && !Plexi[key].prototype.toString).forEach(key => {
  Plexi[key].prototype.toString = Plexi.Base.prototype.toString;
});

module.exports = Plexi;