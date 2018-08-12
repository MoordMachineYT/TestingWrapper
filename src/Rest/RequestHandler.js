"use strict";

const DiscordRESTError = require("./DiscordRESTError.js");
const Request = require("./Request.js");
const SequentialBucket = require("../Util/SequentialBucket.js");

class RequestHandler {
  constructor(client) {
    this.client = client;
    this.ratelimited = false;
    this.limits = new Map();
  }
  request(method, path, options = {}) {
    const req = new Request(this.client, method, path, options);
    return new Promise((res, rej) => {
      const cb = () => {
        req.generate().then((resp) => {
          if(resp.headers.get("x-ratelimit-global")) {
            this.ratelimited = true;
          }
          bucket.resetTime = Date.parse(resp.headers.get("x-ratelimit-reset")) || bucket.resetTime;
          bucket.requests = Number(resp.headers.get("x-ratelimit-limit")) || bucket.requests;
          bucket.remaining = Number(resp.headers.get("x-ratelimit-remaining")) || bucket.remaining;
          if(resp.ok) {
            return resp.json().then(res);
          }
          if(resp.status === 429) {
            bucket.ratelimited = true;
            if(resp.headers.get("x-ratelimit-global")) {
              this.resetTime = Date.parse(resp.headers.get("x-ratelimit-reset"));
            }
            setTimeout(() => {
              bucket.ratelimited = this.ratelimited = false;
              bucket.queue(cb, true);
            }, Number(resp.headers.get("retry-after") + this.client.options.restTimeOffset));
            return;
          } else if(resp.status >= 500 && resp.status < 600) {
            if(req.retried === true) {
              return rej(new DiscordRESTError(resp.status === 502 ? "No gateway available" : "Error while processing request", resp.status));
            }
            req.retried = true;
            bucket.busy = true;
            setTimeout(() => {
              bucket.busy = false;
              bucket.queue(cb, true);
            }, 1000);
            return;
          } else {
            resp.json().then(data => rej(resp.status >= 400 && resp.status < 500 ? new DiscordRESTError(data.message, resp.status) : data));
          }
        }).catch(err => rej(err));
      };
      let route = path;
      if(method === "DELETE" && /\/messages\/\d+$/.test(path)) { // Delete message has it's own limit
        route = method + route;
      }
      if(!this.limits.has(route)) {
        this.limits.set(route, new SequentialBucket(this));
      }
      const bucket = this.limits.get(route);
      bucket.queue(cb);
    });
  }
  get token() {
    return this.client.token;
  }
}

module.exports = RequestHandler;
