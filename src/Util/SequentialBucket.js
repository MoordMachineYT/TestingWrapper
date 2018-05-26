"use strict";

const DiscordRESTError = require("../Rest/DiscordRESTError.js");

class SequentialBucket {
  constructor(client, offset) {
    this.client = client;
    this.offset = offset;

    this.list = [];
    this.ratelimited = false;
  }
  queue(func) {
    this.list.push(func);
    this.handle();
  }
  handle(timeout) {
    if(this.list.length === 0) {
      if(this.timeout) {
        clearTimeout(this.timeout);
      }
      return;
    }
    if(this.timeout) {
      return;
    }
    if(this.remaining === 0 && this.resetTime > Date.now()) {
      return;
    }
    if(timeout || this.ratelimited) {
      if(!timeout) {
        timeout = this.resetTime - Date.now() + this.offset;
      }
      this.timeout = setTimeout(() => {
        this.timeout = null;
        this.handle();
      }, timeout);
      return;
    }
    const req = this.list.shift();
    req.request.generate().end((err, res) => {
      if(res && res.headers) {
        if(res.headers["x-ratelimit-global"]) {
          this.ratelimited = true;
        }
        this.resetTime = Number(res.headers["retry-after"]) + Date.now();
        this.remaining = Number(res.headers["x-ratelimit-remaining"]);
      }
      if(err) {
        if(err.status === 429) {
          this.list.unshift(req);
          this.ratelimited = true;
          setTimeout(() => {
            this.ratelimited = false;
            this.handle();
          }, Number(res.headers["retry-after"]));
        } else if(err.status >= 500 && err.status < 600) {
          this.list.unshift(req);
          this.handle(1000 + this.offset);
        } else {
          let newErr = err.status >= 400 && err.status < 500 ? new DiscordRESTError(res.body, err.status, res.request.path) : err;
          req.rej(newErr);
          this.handle();
        }
      } else {
        req.res(res && res.body ? res.body : {});
        this.handle();
      }
    });
  }
}

module.exports = SequentialBucket;