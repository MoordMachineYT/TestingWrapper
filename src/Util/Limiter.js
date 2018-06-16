"use strict";

class Limiter {
  constructor(limit, interval, ref) {
    this.limit = limit;
    this.interval = interval;
    this.ref = ref == 1 || !ref ? this.limit : ref;

    this.list = [];

    this.used = 0;
    this.firstUsed = 0;
    this.lastUsed = 0;

    this.limited = false;
  }
  queue(func) {
    this.list.push(func);
    this.check();
  }
  check() {
    if (this.list.length === 0) {
      return;
    }
    if (this.timeout) {
      return;
    }
    this.used++;
    if (this.used == 1) {
      this.firstUsed = Date.now();
    }
    this.lastUsed = Date.now();
    if (this.used == this.ref && this.ref < this.limit && this.lastUsed - this.firstUsed < this.ref * (this.interval / this.limit)) {
      this.limited = true;
      this.used = 0;
      const xs = 1 / ((this.interval / this.limit) / 1000 * 2);
      this.timeout = setTimeout(() => {
        this.timeout = null;
        this.list.shift()();
        this.check();
      });
      setTimeout(() => {
        this.limited = false;
      }, (1/xs)*this.ref);
      return;
    } else if (this.limited) {
      this.timeout = setTimeout(() => {
        this.timeout = null;
        this.list.shift()();
        this.check();
      }, (this.interval / this.limit) * 2);
      return;
    }
    if (this.ref >= this.limit) {
      this.timeout = setTimeout(() => {
        this.timeout = null;
        this.list.shift()();
        this.check();
      }, this.interval / this.limit);
    } else {
      this.list.shift()();
      this.check();
    }
  }
  clear() {
    while(this.list.length) {
      this.list.shift();
    }
    this.lastUsed = 0;
    this.firstUsed = 0;
    this.limited = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.used = 0;
  }
}

module.exports = Limiter;
