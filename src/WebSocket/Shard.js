"use strict";

let EventEmitter = require("events").EventEmitter;
const Limiter = require("../Util/Limiter.js");
const WebSocket = require("ws");
const { OPCodes, GatewayClose, WSError, GATEWAY_VERSION } = require("../Util/Constants.js");
let Zlib;
let Z_SYNC_FLUSH;
try {
  Zlib = require("zlib-sync");
  Z_SYNC_FLUSH = Zlib.Z_SYNC_FLUSH;
} catch(err) { // eslint-disable-line no-empty
}

const ClientUser = require("../Structures/ClientUser.js");
const Guild = require("../Structures/Guild.js");
const Member = require("../Structures/Member.js");
const Message = require("../Structures/Message.js");
const UnavailableGuild = require("../Structures/UnavailableGuild.js");

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
  constructor(client, id) {
    super();
    this.client = client;
    this.id = id;

    this.attempts = 0;

    this.presence = JSON.parse(JSON.stringify(client.options.presence));

    this.reset();
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
    if(!this.globalqueue || !this.presencequeue) {
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
        os: process.platform,
        browser: "plexi",
        device: "plexi"
      },
      compress: false,
      large_threshold: this.client.options.largeThreshold,
      presence: this.client.options.presence,
      shard: [this.id, this.client.options.shardCount]
    };
    if(packet.presence.status === "idle") {
      packet.presence.since = Date.now();
      packet.presence.afk = true;
    }
    this.send({
      "op": OPCodes.IDENTIFY,
      "d": packet
    });
  }
  resume() {
    this.send({
      op: 6,
      d: {
        token: this.client.token,
        session_id: this.sessionID,
        seq: this.seq
      }
    });
  }
  updateStatus(data) {
    data.afk = data.status === "idle";
    if(data.afk) {
      data.since = Date.now();
    }
    this.presence = data;
    this.send({
      "op": OPCodes.STATUS_UPDATE,
      "d": data
    });
  }
  updateVoiceStatus(options) {
    this.send({
      op: OPCodes.VOICE_STATUS_UPDATE,
      d: options
    });
  }
  async connect() {
    if(this.ws && this.status !== "disconnected") {
      this.debug(new Error(WSError.EXISTS));
      return;
    }
    if(!this.client.token) {
      throw new Error("no token provided");
    }
    this.status = "connecting";
    this.attempts++;
    this.ws = new WebSocket(this.client.gatewayURL + `?v=${GATEWAY_VERSION}&encoding=${Erlpack ? "etf" : "json"}${Zlib ? "&compress=zlib-stream" : ""}`);
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  }
  async disconnect(rec, err) {
    if(!this.ws) {
      throw new Error(WSError.DOESNT_EXIST);
    }
    this.debug(err);
    this.ws.onclose = undefined;
    if(rec) {
      this.ws.terminate();
      this.connect();
    } else {
      this.ws.close(1000);
    }
    this.emit("disconnect", this.id);
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
        this.ws.send((Erlpack !== undefined ? Erlpack.pack : JSON.parse)(data));
      });
      this.globalqueue.queue(() => {}); // eslint-disable-line no-empty
      return;
    }
    this.globalqueue.queue(() => {
      this.ws.send((Erlpack !== undefined ? Erlpack.pack : JSON.parse)(data));
    });
  }
  onOpen(event) {
    if(event && event.target && event.target.url) {
      this.gateway = event.target.url;
    }
    this.status = "handshaking";
    this.emit("connect", this.id);
    this.debug(`Connected to ${this.gateway} !`);
    if(this.sessionID) {
      this.resume();
    } else {
      this.identify();
    }
  }
  onMessage(m) {
    let data = m.data;
    try {
      let packet;
      if(Zlib) {
        if(!this.inflate) {
          this.inflate = new Zlib.Inflate({
            chunksize: 128 * 1024
          });
        }
        if(data instanceof ArrayBuffer) {
          data = Buffer.from(data);
        } else if(Array.isArray(data)) {
          data = Buffer.concat(data);
        }
        const flush = data.length >= 4 && data.readUInt32BE(data.length - 4) === 0xFFFF;
        
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
      } else {
        packet = WebSocket.unpack(data);
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
          this._trace = packet.d._trace;
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
          packet.d.member.guild_id = packet.d.guild_id;
        }
        const msg = new Message(packet.d, this.client);
        this.client.emit("message", channel.messages.set(msg.id, msg));
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
          this.emit("ready");
        }, this.client.options.guildCreateTimeout);
        break;
      }
      case "GUILD_CREATE": {
        this.client.guildShardMap[packet.d.id] = this.id;
        const available = this.client.guilds.has(packet.d.id) ? this.client.guilds.get(packet.d.id).available : true;
        const guild = new Guild(packet.d, this);
        this.client.guilds.set(packet.d.id, guild);
        if(this.client.options.getAllMembers && this.status === "ready") {
          this.getAllMembers({
            guildID: guild.id, 
            query: ""
          });
        }
        if(this.status !== "ready") {
          break;
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
        delete this.client.guildShardMap[packet.d.id];
        break;
      }
      case "GUILD_MEMBERS_CHUNK": {
        let guild = this.client.guilds.get(packet.d.guild_id);
        if(!guild) {
          this.debug(new Error("GUILD_MEMBERS_CHUNK event received but guild not found"));
          break;
        }
        for(const member of packet.d.members) {
          member.guild = guild;
          guild.members.set(member.user.id, new Member(member, this.client));
        }
        this.client.guilds.set(guild.id, guild);
        if(this.client.guilds.every(g => g.memberCount === g.members.size) && this.status !== "ready") {
          this.emit("ready");
        }
        break;
      }
      case "VOICE_STATE_UPDATE": {
        if(packet.d.user_id === this.client.user.id) {
          if(!this.client.voiceConnections.has(packet.d.guild_id)) {
            this.debug("Unknown voice state update, " + JSON.stringify(packet.d));
            break;
          }
          this.client.voiceConnections.get(packet.d.guild_id).update(packet.d);
        }
        break;
      }
      case "VOICE_SERVER_UPDATE": {
        if(!this.client.voiceConnections.has(packet.d.guild_id)) {
          this.debug("Unknown voice server update received for guild " + packet.d.guild_id);
        }
        packet.d.user_id = this.client.user.id;
        this.client.voiceConnections.get(packet.d.guild_id).connect(packet.d);
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
    for(const id of this.client.guilds.filter(g => g.shard.id === this.id).keyArray) {
      this.send({
        "op": OPCodes.REQUEST_GUILD_MEMBERS,
        "d": {
          guild_id: id,
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
  emit() {
    if(["connect", "disconnect"].indexOf(arguments[0] !== -1)) {
      arguments[0] = "shard" + arguments[0][0].toUpperCase() + arguments[0].slice(1);
    }
    this.client.emit.apply(this.client, arguments);
  }
}

module.exports = Shard;
