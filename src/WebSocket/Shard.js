"use strict";

let EventEmitter = require("events").EventEmitter;
const Limiter = require("../Util/Limiter.js");
const WebSocket = require("./WebSocket.js");
let Zlib = require("zlib");
const { OPCodes, GatewayClose, WSError, GATEWAY_URL } = require("../Constants.js");

const ClientUser = require("../Structures/ClientUser.js");
const Guild = require("../Structures/Guild.js");
const Member = require("../Structures/Member.js");
const Message = require("../Structures/Message.js");
const UnavailableGuild = require("../Structures/UnavailableGuild.js");

const Z_SYNC_FLUSH = Zlib.constants.Z_SYNC_FLUSH;
Zlib = require("zlib-sync");

let Erlpack;
try {
  Erlpack = require("erlpack");
} catch(err) { // eslint-disable-line no-empty
}

try {
  EventEmitter = require("eventemitter16");
} catch(err) { // eslint-disable-line no-empty
}

class Shard extends EventEmitter {
  constructor(manager, id) {
    super();
    this.client = manager.client;
    this.id = id;

    this.attempts = 0;
    this.gateway = GATEWAY_URL;

    this.reset();

    return this;
  }
  reset() {
    this.seq = 0;
    this.sessionID = null;
    if(this.status == "connected") {
      this.ws.close(1000);
    }
    delete this.ws;
    this.ws = null;
    this.status = "disconnected";
    this.guildCount = null;

    this.heartbeat(-1);
    if(!this.globalqueue && !this.presencequeue) {
      this.globalqueue = new Limiter(120, 60000, 60);
      this.presencequeue = new Limiter(5, 60000, 5);
    } else {
      this.globalqueue.clear();
      this.presencequeue.clear();
    }
  }
  identify() {
    if(!this.ws) {
      throw new Error(WSError.DOESNT_EXIST);
    }
    if(this.status === "ready") {
      throw new Error(WSError.READY);
    }
    let packet = {
      token: this.client.token,
      properties: {
        "os": process.platform,
        "browser": "plexi",
        "device": "plexi"
      },
      compress: false,
      large_threshold: this.client.options.largeThreshold,
      presence: this.client.options.presence
    };
    if(packet.presence.status === "idle") {
      packet.presence.since = Date.now();
    }
    if(this.client.recShard) {
      packet.shard = [this.id, this.client.recShard];
    }
    this._send({
      "op": OPCodes.IDENTIFY,
      "d": packet
    });
  }
  resume() {
    if(!this.ws) {
      this.debug(new Error(WSError.CLOSED));
      return;
    }
    this.ws.onclose = undefined;
    this.ws.terminate();
    this.ws = null;
    this.status = "disconnected";
    this.emit("disconnect", this.id);
    this.connect();

  }
  setPresence(data) {
    data.afk = data.status === "idle";
    if(data.afk) {
      data.since = Date.now();
    }
    this.send({
      "op": OPCodes.STATUS_UPDATE,
      "d": data
    });
  }
  connect(gateway) {
    if(this.ws && this.status !== "disconnected") {
      this.debug(new Error(WSError.EXISTS));
      return;
    }
    if(!this.client.token) {
      throw new Error("no token provided");
    }
    this.status = "connecting";
    this.attempts++;
    if(gateway) {
      this.gateway = gateway;
    }
    this.ws = WebSocket.create(this.gateway, Erlpack ? "etf" : "json");
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  }
  disconnect(rec, err) {
    if(!this.ws) {
      throw new Error(WSError.DOESNT_EXIST);
    }
    this.debug(err);
    this.ws.onclose = undefined;
    this.emit("disconnect", this.id);
    if(rec) {
      this.resume();
    } else {
      if(this.status !== "disconnected") {
        this.ws.close(1000);
      }
    }
  }
  heartbeat(time) {
    if(time < 0) {
      if (this.attempts > 0) {
        this.debug("No longer heartbeating! OK if shard is being reset");
      }
      clearInterval(this.heartbeating);
      this.heartbeating = null;
      this.heartbeatInterval = 0;
      return;
    }
    if(!time) {
      if(!this.heartbeatReceived) {
        this.debug("No heartbeat received, requesting resume");
        clearInterval(this.heartbeating);
        this.disconnect(true);
        return;
      }
      this.debug("Heartbeating");
      this.send({
        "op": OPCodes.HEARTBEAT,
        "d": this.seq >= 0 ? this.seq : null
      });
      return;
    } else if(time === true) {
      this.debug("Heartbeating");
      this.send({
        "op": OPCodes.HEARTBEAT,
        "d": this.seq >= 0 ? this.seq : null
      });
    } else {
      this.heartbeatInterval = time;
      if(this.heartbeating) {
        clearInterval(this.heartbeating);
      }
      this.heartbeatReceived = true;
      this.heartbeating = setInterval(() => {
        this.heartbeat();
      }, this.heartbeatInterval);
    }
  }
  pong() {
    this.heartbeatReceived = true;
  }
  send(data, presence) {
    if(!this.ws) {
      return;
    }
    this.debug(data);
    if(presence) {
      this.presencequeue.queue(() => {
        this.ws.send(WebSocket.pack(data));
      });
      return;
    }
    this.globalqueue.queue(() => {
      this.ws.send(WebSocket.pack(data));
    });
  }
  _send(data) {
    if (!this.ws) {
      return;
    }
    this.debug(data);
    this.ws.send(WebSocket.pack(data));
  }
  onOpen(event) {
    if(event && event.target && event.target.url) {
      this.gateway = event.target.url;
    }
    this.status = "handshaking";
    this.emit("connect", this.id);
    this.debug(`Connected to ${this.gateway} !`);
    if(this.sessionID) {
      let packet = {
        "op": OPCodes.RESUME,
        "d": {
          "token": this.client.token,
          "session_id": this.sessionID,
          "seq": this.seq
        }
      };
      this._send(packet);
    } else {
      this.identify();
    }
  }
  onMessage({ data }) {
    try {
      let packet;
      if(!this.inflate) {
        this.inflate = new Zlib.Inflate({
          chunksize: 128 * 1024
        });
      }
      if(data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      } else if(Array.isArray(data)) {
        data = Buffer.concat(data);
      }

      const len = data.length;
      const flush = len >= 4 && data.readUInt32BE(len - 4) === 0xFFFF;
      
      this.inflate.push(data, flush ? Z_SYNC_FLUSH : false);
      if(!flush) {
        return;
      }
      if(this.inflate.err) {
        this.debug(new Error(`Zlib error ${this.inflate.err}: ${this.inflate.msg}`));
        return;
      }
      try {
        packet = WebSocket.unpack(this.inflate.result);
      } catch(err) {
        this.debug(err);
        return;
      }
      if(this.client.listenerCount("rawWS")) {
        this.client.emit("rawWS", packet, this.id);
      }
      switch(packet.op) {
      case OPCodes.DISPATCH: {
        if(!this.client.options.disableEvents[packet.t]) {
          this.onEvent(packet);
        }
        break;
      }
      case OPCodes.HEARTBEAT: {
        this.heartbeat(true);
        break;
      }
      case OPCodes.RECONNECT: {
        this.resume();
        break;
      }
      case OPCodes.INVALID_SESSION: {
        if(packet.d === true) {
          this.debug("Invalid session, requesting resume!");
          this.resume();
          break;
        }
        this.debug("Invalid session, reidentifying!");
        this.reset();
        setTimeout(() => {
          this.connect();
        }, 5000);
        break;
      }
      case OPCodes.HELLO: {
        if (this.listenerCount("hello")) {
          this.emit("hello", packet.d);
        }
        this.heartbeat(packet.d.heartbeat_interval);
        break;
      }
      case OPCodes.HEARTBEAT_ACK: {
        this.pong();
        break;
      }
      default: {
        this.debug("Unknown packet received, " + JSON.stringify(packet));
        break;
      }
      }
    } catch(err) {
      this.debug(err);
    }
  }
  onClose(event) {
    let err = !event.code || event.code === 1000 ? null : new Error(event.code + ": " + event.reason);
    let rec = true;
    this.status = "disconnected";
    if(event.code) {
      switch(event.code) {
      case GatewayClose.UNKNOWN_ERROR: {
        err = new Error("Unknown connection error" + event.reason ? ": " + event.reason : "");
        break;
      }
      case GatewayClose.UNKNOWN_OP_CODE: {
        err = new Error("Gateway received invalid OP code");
        break;
      }
      case GatewayClose.DECODE_ERROR: {
        err = new Error("Gateway received invalid message");
        break;
      }
      case GatewayClose.NOT_AUTHENTICATED: {
        err = new Error("Not authenticated");
        break;
      }
      case GatewayClose.AUTHENTICATION_FAILED: {
        err = new Error("Authentication failed");
        rec = false;
        break;
      }
      case GatewayClose.ALREADY_AUTHENTICATED: {
        err = new Error("Already authenticated");
        break;
      }
      case GatewayClose.INVALID_SEQ: {
        err = new Error("Invalid sequence number given: " + this.seq);
        this.seq = 0;
        break;
      }
      case GatewayClose.RATE_LIMITED: {
        err = new Error("Gateway connection was ratelimited");
        break;
      }
      case 4006:
      case GatewayClose.SESSION_TIMEOUT: {
        err = null;
        this.sessionID = null;
        break;
      }
      case GatewayClose.INVALID_SHARD: {
        err = new Error("Invalid shard: " + this.id);
        rec = false;
        break;
      }
      case GatewayClose.SHARDING_REQUIRED: {
        err = new Error("Sharding required, please increase Client#options.shardCount");
        rec = false;
        break;
      }
      case 1006: {
        err = new Error("Lost connection to the gateway");
      }
      }
    }
    this.disconnect(rec, err);
  }
  onError(err) {
    this.debug(err);
  }
  onEvent(packet) {
    if(++this.seq < packet.s) {
      this.debug("Invalid sequence number, requesting resume");
      this.resume();
    }
    switch (packet.t) {
    case "TYPING_START": {
      break;
    }
    case "MESSAGE_CREATE": {
      const channel = this.client.channels.get(packet.d.channel_id);
      if(!channel) {
        this.debug("Message created but channel not found! OK if deleted.");
        break;
      }
      if(packet.d.member) {
        packet.d.member.user = packet.d.author;
      }
      const msg = new Message(packet.d, this.client);
      this.client.emit("message", channel.messages.set(msg.id, msg));
      this.client.channels.set(channel.id, channel); // Caching system doesn't work otherwise
      break;
    }
    case "MESSAGE_DELETE": {
      const channel = this.client.channels.get(packet.d.channel_id);
      if(!channel) {
        this.debug("Message deleted but channel not found! OK if deleted.");
        break;
      }
      const msg = channel.messages.get(packet.d.id);
      if(!msg) {
        break;
      }
      msg.deleted = true;
      this.client.emit("messageDelete", channel.messages.set(msg.id, msg));
      this.client.channels.set(channel.id, channel);
      break;
    }
    case "MESSAGE_UPDATE": {
      const channel = this.client.channels.get(packet.d.channel_id);
      if(!channel) {
        this.debug("Message updated but channel not found! OK if deleted.");
        break;
      }
      const msg = channel.messages.get(packet.d.id);
      if(!msg) {
        break;
      }
      this.client.emit("messageUpdate", msg, channel.messages.set(msg.id, msg.update(packet.d)));
      this.client.channels.set(channel.id, channel);
      break;
    }
    case "READY": {
      this.sessionID = packet.d.session_id;
      this.guildCount = packet.d.guilds.length;
      this.client.user = new ClientUser(packet.d.user, this.client);
      for(const guild of packet.d.guilds) {
        guild.shard = this;
        this.client.guilds.set(guild.id, new UnavailableGuild(guild));
      }
      this.guildCreateTimeout = setTimeout(() => {
        this.status = "ready";
        if(!this.client.options.getAllMembers) {
          this.emit("ready");
        } else {
          this.getAllMembers();
        }
      }, this.client.options.guildCreateTimeout);
      break;
    }
    case "GUILD_CREATE": {
      const available = this.client.guilds.has(packet.d.id) ? this.client.guilds.get(packet.d.id).available : true;
      const guild = new Guild(packet.d, this);
      this.client.guilds.set(packet.d.id, guild);
      if(this.status !== "ready") {
        if(this.guildCount === this.client.guilds.filter(g => g instanceof Guild).size) {
          clearTimeout(this.guildCreateTimeout);
          delete this.guildCreateTimeout;
          this.status = "ready";
          if(this.client.options.getAllMembers) {
            this.getAllMembers();
          } else {
            this.emit("ready");
          }
        }
        break;
      }
      if(this.client.options.getAllMembers) {

      }
      this.client.emit(available ? "guildCreate" : "guildAvailable", guild);
      break;
    }
    case "GUILD_DELETE": {
      let guild = this.client.guilds.get(packet.d.id);
      if(!guild) {
        this.debug(new Error("GUILD_DELETE event received but guild not found"));
        break;
      }
      if(packet.d.unavailable) {
        guild.available = false;
        guild.shard = this;
        this.client.guilds.set(packet.d.id, new UnavailableGuild(packet.d));
        this.client.emit("guildUnavailable", guild);
        break;
      }
      this.client.guilds.delete(packet.d.id);
      this.client.emit("guildDelete", guild);
      break;
    }
    case "GUILD_MEMBERS_CHUNK": {
      let guild = this.client.guilds.get(packet.d.guild_id);
      if(!guild) {
        this.debug(new Error("GUILD_MEMBERS_CHUNK event received but guild not found"));
      }
      for(const member of packet.d.members) {
        member.guild = guild;
        guild.members.set(member.user.id, new Member(member, this.client));
      }
      this.client.guilds.set(guild.id, guild);
      if(this.client.guilds.every(g => g.memberCount === g.members.size)) {
        this.emit("ready");
      }
      break;
    }
    default: {
      this.debug("Unknown packet event, " + JSON.stringify(packet, null, 2));
    }
    }
  }
  getAllMembers(options) {
    if(!this.ws) {
      return;
    }
    if(options) {
      this.send({
        "op": OPCodes.REQUEST_GUILD_MEMBERS,
        "d": {
          guild_id: options.guildID,
          query: options.query || "",
          limit: options.limit || 0
        }
      });
      return;
    }
    for(const guild of this.client.guilds.filter(g => g.shard.id === this.id)) {
      this.send({
        "op": OPCodes.REQUEST_GUILD_MEMBERS,
        "d": {
          guild_id: guild.id,
          query: "",
          limit: 0
        }
      });
    }
  }
  debug(val) {
    if (!val) {
      return;
    }
    if(val instanceof Error) {
      this.emit("error", val, this.id);
      return;
    }
    this.emit("debug", val, this.id);
  }
}

module.exports = Shard;