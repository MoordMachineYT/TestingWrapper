"use strict";

class SequentialBucket {
  constructor(manager) {
    this.manager = manager;
    this.list = [];
    this.ratelimited = this.busy = false;
    this.resetTime = 0;
    this.limit = this.remaining = 5;

    this.handle = this.handle.bind(this);
  }
  queue(func, first) {
    this.list[first ? "unshift" : "push"](func);
    this.handle();
  }
  handle() {
    if(this.list.length === 0) {
      if(this.busy) {
        this.busy = false;
      }
      return;
    }
    if(this.busy) {
      return;
    }
    if(this.ratelimited) {
      return;
    }
    if(this.manager.ratelimited) { // May be no setTimeout calls
      setTimeout(this.handle, Date.now() - this.manager.resetTime + this.manager.client.options.restTimeOffset);
      return;
    }
    if(this.remaining === 0) {
      if(this.resetTime < Date.now() - this.manager.client.options.restTimeOffset) {
        this.remaining = this.limit;
      } else {
        setTimeout(this.handle, Date.now() - this.resetTime + this.manager.client.options.restTimeOffset);
        return;
      }
    }
    --this.remaining;
    this.list.shift()();
    this.handle();
  }
}

module.exports = SequentialBucket;