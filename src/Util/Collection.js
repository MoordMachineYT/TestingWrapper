"use strict";

class Collection extends Map {
  constructor(base, limit) {
    super(base);
    this.limit = limit || Infinity;
  }
  set(key, val = null) {
    if(typeof key === "undefined") {
      throw new TypeError("key must have a value");
    }
    if(this.size >= this.limit) {
      throw new RangeError("limit reached");
    }
    super.set(key, val);
    return this;
  }
  delete(key) {
    if(!this.has(key)) {
      throw new Error("key not found");
    }
    super.delete(key);
    return this;
  }
  find(val1, val2) {
    if(typeof val1 === "function") {
      if(val2) {
        val1 = val1.bind(val2);
      }
      for(const [key, val3] of this.entries()) {
        if(val1(val3, key)) {
          return val3;
        }
      }
      return null;
    } else if(typeof val1 === "string") {
      for(const val3 of this.values()) {
        if(val3[val1] === val2) {
          return val3;
        }
      }
      return null;
    }
    return null;
  }
  findKey(val1, val2) {
    if(typeof val1 === "function") {
      if(val2) {
        val1 = val1.bind(val2);
      }
      for(const [key, val] of this.entries()) {
        if(val1(val, key)) {
          return key;
        }
      }
      return null;
    } else if(typeof val1 === "string") {
      for(const [key, val] of this.entries()) {
        if(val[val1] === val2) {
          return key;
        }
      }
      return null;
    }
    return null;
  }
  filter(fn, thisArg) {
    if(thisArg) {
      fn = fn.bind(thisArg);
    }
    const coll = new this.constructor();
    for(let [key, val] of this.entries()) {
      if(fn(val, key)) {
        coll.set(key, val);
      }
    }
    return coll;
  }
  map(fn, thisArg) {
    const arr = new Array(this.size);
    if(thisArg) {
      fn = fn.bind(thisArg);
    }
    for(const [key, val] of this.entries()) {
      arr.push(fn(val, key));
    }
    return arr;
  }
  forEach(fn, thisArg) {
    super.forEach(fn, thisArg);
    return this;
  }
  some(fn, thisArg) {
    if(thisArg) {
      fn = fn.bind(thisArg);
    }
    for(const [key, val] of this.values()) {
      if(fn(val, key)) {
        return true;
      }
    }
    return false;
  }
  every(fn, thisArg) {
    if(thisArg) {
      fn = fn.bind(thisArg);
    }
    for(const [key, val] of this.values()) {
      if(!fn(val, key)) {
        return false;
      }
    }
    return true;
  }
  reduce(fn, initVal) {
    let acc;
    if(initVal) {
      acc = initVal;
      for(const [key, val] of this.entries()) {
        acc = fn(acc, val, key, this);
      }
    } else {
      let first = true;
      for(const [key, val] of this.entries()) {
        if(first) {
          first = false;
          acc = val;
          continue;
        }
        acc = fn(acc, val, key, this);
      }
    }
    return acc;
  }
  split(fn, thisArg) {
    if(thisArg) {
      fn = fn.bind(thisArg);
    }
    const arr = [new this.constructor, new this.constructor];
    for(const [key, val] of this.entries()) {
      if(fn(val, key)) {
        arr[0].set(key, val);
      } else {
        arr[1].set(key, val);
      }
    }
    return arr;
  }
  merge(...col) {
    const clone = this.clone();
    for(const coll of col) {
      for(const [key, val] of coll.entries()) {
        if(!clone.has(key)) {
          clone.set(key, val);
        }
      }
    }
    return clone;
  }
  sweep(fn, thisArg) {
    if(thisArg) {
      fn = fn.bind(thisArg);
    }
    for(const [key, val] of this.entries()) {
      if(fn(val, key)) {
        this.delete(key);
      }
    }
    return this;
  }
  toJSON() {
    let obj = {};
    for(const [key, val] of this.entries()) {
      obj[key] = val;
    }
    return obj;
  }
  clone() {
    return new this.constructor(this);
  }
  get first() {
    return Array.from(this.values())[0];
  }
  get firstKey() {
    return Array.from(this.keys())[0];
  }
  get last() {
    return Array.from(this.values())[this.size - 1];
  }
  get lastKey() {
    return Array.from(this.keys())[this.size - 1];
  }
  get random() {
    return Array.from(this.values())[~~(Math.random() * this.size)];
  }
  get randomKey() {
    return Array.from(this.keys())[~~(Math.random() * this.size)];
  }
  get array() {
    return Array.from(this.values());
  }
  get keyArray() {
    return Array.from(this.keys());
  }
}

module.exports = Collection;