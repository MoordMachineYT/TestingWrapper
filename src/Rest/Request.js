"use strict";

const fetch = require("node-fetch");
const FormData = require("form-data");
const https = require("https");
const { BASE } = require("./Endpoints.js");

let agent = new https.Agent({ keepAlive: true });

class Request {
  constructor(client, method, path, options) {
    this.client = client;
    this.method = method;
    this.path = path;
    this.options = options;
  }
  generate() {
    let headers = {
      "User-Agent": `DiscordBot (https://github.com/MoordMachineYT/TestingWrapper, ${require("../../package.json").version})`
    };
    if(this.options.auth) {
      headers["Authorization"] = this.client.options.token.startsWith("Bot ") ? this.client.options.token : "Bot " + this.client.options.token;
    }
    if(this.options.reason) {
      headers["X-Audit-Log-Reason"] = encodeURIComponent(this.options.reason);
    }
    if(this.options.headers) {
      for(const i in this.options.headers) {
        headers[i] = this.options.headers[i];
      }
    }
    let body;
    if(this.options.files && this.options.files.length) {
      body = new FormData;
      for(const file of this.options.files) {
        if(file && file.file) {
          body.append(file.name, file.file, file.name);
        }
      }
      if(typeof this.options.data !== "undefined") {
        body.append("payload_json", JSON.stringify(this.options.data));
        headers = Object.assign(headers, body.getHeaders());
      }
    } else if(this.options.data !== undefined) {
      body = JSON.stringify(this.options.data);
      headers["Content-Type"] = "application/json";
    }
    return fetch(BASE + this.path, {
      method: this.method,
      headers,
      agent,
      body,
    });
  }
}

module.exports = Request;
