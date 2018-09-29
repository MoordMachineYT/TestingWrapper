"use strict";

const Dgram = require("dgram");
const DNS = require("dns");
const EventEmitter = require("events").EventEmitter;
const WebSocket = require("ws");

const ENCRYPTION_MODE = "xsalsa20_poly1305";
const MAX_FRAME_SIZE = 1276 * 3;

class VoiceConnection extends EventEmitter {
  constructor(shard, options = {}) {
    super();
    this.shard = shard;
    this.options = options;
    this.sessionID = null;
    this.packetBuffer = Buffer.alloc(12 + 16 + MAX_FRAME_SIZE);
    setTimeout(() => {
      if(this.ws === undefined) {
        this.emit("timeout");
        this.shard.client.voiceConnections.leave(this.options.guildID);
      }
    }, this.shard.client.options.voiceConnectionTimeout);
  }
  update(data) {
    this.mute = data.mute !== undefined ? data.mute : this.mute || false;
    this.deaf = data.deaf !== undefined ? data.deaf : this.deaf || false;
    this.selfMute = data.self_mute !== undefined ? data.self_mute : this.selfMute || false;
    this.selfDeaf = data.self_deaf !== undefined ? data.self_deaf : this.selfDeaf || false;
    this.sessionID = data.session_id;
    this.ponged = true;
  }
  disconnect(err, reconnect) {
    if(err) {
      this.emit("error", err);
    }
    if(reconnect) {
      this.ws.terminate();
    } else {
      this.ws.close(1000);
    }
  }
  connect(data) {
    if(data !== undefined) {
      this._token = data.token;
      this.options.endpoint = data.endpoint.split(":")[0];
      this.options.userID = data.user_id || this.options.userID;
    }
    if(this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.disconnect();
      setTimeout(() => this.connect(), 500);
      return;
    }
    this.ws = new WebSocket("wss://" + this.options.endpoint + "?v=3");
    this.ws.on("open", () => {
      this.emit("connect");
      this.ws.send(JSON.stringify({
        op: 2,
        d: {
          server_id: this.options.guildID,
          user_id: this.options.userID,
          session_id: this.sessionID,
          token: this._token
        }
      }));
    }).on("message", (m) => {
      const packet = JSON.parse(m);
      switch(packet.op) {
        case 8: {
          this.heartbeat(packet.d.heartbeat_interval);
          break;
        }
        case 2: {
          this.ssrc = packet.d.ssrc;
          if(packet.d.modes.indexOf(ENCRYPTION_MODE) === -1) {
            this.disconnect(new Error("No supported voice mode found"));
            break;
          }
          this.packetBuffer.writeUIntBE(this.ssrc, 8, 4);
          this.options.port = packet.d.port;
          DNS.lookup(this.options.endpoint, (err, adress) => {
            if(err) {
              this.emit("error", err);
              return;
            }
            this.options.ip = adress;
            this.udp = Dgram.createSocket("udp4");
            this.udp.once("message", (packet) => {
              this.debug(packet.toString());
              let localIP = "";
              for(let i = 4; i < packet.indexOf(0, i); i++) {
                localIP += String.fromCharCode(packet[i]);
              }
              const localPort = parseInt(packet.readUIntLE(packet.length - 2, 2).toString(10));
              this.ws.send(JSON.stringify({
                op: 1,
                d: {
                  adress: localIP,
                  port: localPort,
                  mode: ENCRYPTION_MODE
                }
              }));
            }).on("error", (err, msg) => {
              if(msg) {
                this.debug("Voice UDP error: " + msg);
              }
              this.disconnect(err);
            }).on("close", (err) => {
              if(err) {
                this.emit("warn", "Voice UDP close: " + err);
              }
            });
            const packet = Buffer.alloc(70);
            packet.writeUIntBE(this.ssrc, 0, 4);

          });
          break;
        }
      }
    }).on("close", event => {
      this.disconnect(event);
    }).on("error", err => {
      this.emit("error", err);
    });
  }
  play() {

  }
  heartbeat(interval) {
    if(interval === undefined) {
      if(this.ponged === false) {
        this.debug("No heartbeat received, reconnecting");
        this.disconnect();
        return;
      }
      this.ponged = false;
      this.ws.send(JSON.stringify({
        op: 3,
        d: Date.now()
      }));
    } else if(interval === 0) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    } else {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = setInterval(() => this.heartbeat(), interval * 0.75);
      this.heartbeat();
    }
  }
  _sendPacket(packet) {
    if(!this.udp) {
      return;
    }
    try {
      this.udp.send(packet, 0, packet.length, this.options.port, this.options.adress);
    } catch(err) {
      this.emit("error", err);
    }
  }
}

module.exports = VoiceConnection;