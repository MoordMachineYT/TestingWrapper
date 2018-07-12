"use strict";

const snek = require("snekfetch");
const https = require("https");
const { BASE } = require("./Endpoints.js");

let agent = new https.Agent({ keepAlive: true });

class Request {
  constructor(client, method, path, options) {
    this.client = client;
    this.method = method;
    this.path = path;
    this.route = options.route;
    this.options = options;
  }
  generate() {
    let headers = {
      "User-Agent": `DiscordBot (https://github.com/MoordMachineYT/TestingWrapper, ${require("../../package.json").version})`
    };
    if(this.options.auth) {
      headers["Authorization"] = this.client.token.startsWith("Bot ") ? this.client.token : "Bot " + this.client.token;
    }
    if(this.options.reason) {
      headers["X-Audit-Log-Reason"] = encodeURIComponent(this.options.reason);
    }
    if(this.options.headers) {
      for(const i in this.options.headers) {
        headers[i] = this.options.headers[i];
      }
    }

    const request = snek[this.method](BASE + this.path, {
      agent,
      headers,
      data: typeof this.options.data !== "undefined" && !this.options.files ? JSON.stringify(this.options.data) : null
    });
    if(this.options.files) {
      for(const file of this.options.files) {
        if(file && file.file) {
          request.attach(file.name, file.file, file.name);
        }
      }
      if(typeof this.options.data !== "undefined") {
        request.attach("payload_json", JSON.stringify(this.options.data));
      }
    } else if(typeof this.options.data !== "undefined") {
      request.send(this.options.data);
    }
    return request;
  }
}

module.exports = Request;