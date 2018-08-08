"use strict";

class SequentialBucket {
  constructor(manager) {
    this.manager = manager;
    this.list = [];
    this.ratelimited = false;
    this.busy = false;
    this.resetTime = 0;
    this.limit = this.remaining = 10;

    this.handle = this.handle.bind(this);
  }
  queue(func, first) {
    this.list[first ? "unshift" : "push"](func);
    this.handle();
  }
  handle() {
    if(!this.list.length) {
      if(this.busy) {
        this.busy = false;
      }
      return;
    }
    if(this.busy) {
      return;
    }
    if(this.ratelimited || this.manager.ratelimited) {
      return; // Always at least 1 function in list in this case
    }
    if(this.remaining === 0) {
      if(this.resetTime < Date.now() - this.manager.client.options.restTimeOffset) {
        this.remaining = this.limit;
      } else {
        setTimeout(this.handle, Date.now() - this.manager.client.options.restTimeOffset);
        return;
      }
    }
    --this.remaining;
    this.list.shift()();
    this.handle();
  }
}

module.exports = SequentialBucket;