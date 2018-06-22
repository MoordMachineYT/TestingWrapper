"use strict";

function extend() {
  if(new.target) {
    throw new Error("extend can not be instantiated");
  }

  /* Object */
  Object.defineProperty(Object.prototype, "size", {
    get: function() {
      return Object.keys(this).length;
    }
  });
  Object.defineProperty(Object.prototype, "array", {
    value: function() {
      return Object.values(this);
    }
  });

  /* String */
  String.prototype.array = function() {
    return this.split("");
  };
  String.prototype.random = function(size = 1, firstIndex = 0, lastIndex) {
    let str = this.substring(firstIndex, lastIndex || this.length);
    if(size < 0) {
      size *= -1;
    }
    var returnStr = new String();
    for(let i = 0; i < size; i++) {
      returnStr += str[Math.random()*size];
    }
    return returnStr;
  };

  /* Number */
  Number.prototype.array = function() {
    return new Array(this.valueOf());
  };
  Number.prototype.add = function(num) {
    const _this = new Number(this);
    if(Array.isArray(num)) {
      this.valueOf = () => {
        return num.reduce((acc, val) => acc + val, _this.valueOf());
      };
    } else {
      this.valueOf = () => {
        return _this + num;
      };
    }
    return this;
  };
  Number.prototype.subtract = function(num) {
    if(!Array.isArray(num)) {
      return this.add(num * -1);
    } else {
      const _this = new Number(this);
      this.valueOf = () => {
        return num.reduce((acc, val) => acc - val, _this.valueOf());
      };
      return this;
    }
  };
  Number.prototype.multiply = function(num) {
    const _this = new Number(this);
    if(Array.isArray(num)) {
      this.valueOf = () => {
        return num.reduce((acc, val) => acc * val, _this.valueOf());
      };
    } else {
      this.valueOf = () => {
        return _this + num;
      };
    }
    return this;
  };
  Number.prototype.divide = function(num) {
    const _this = new Number(this);
    if(Array.isArray(num)) {
      this.valueOf = () => {
        return num.reduce((acc, val) => acc / val, _this.valueOf());
      };
    } else {
      this.valueOf = () => {
        return _this + num;
      };
    }
    return this;
  };

  /* Array */
  Array.prototype.random = function(size = 1, firstIndex = 0, lastIndex) {
    if(size < 0) {
      size *= -1;
    }
    const tempArr = [];
    for(let i = 0; i < this.length; i++) {
      if(i >= firstIndex && i <= (lastIndex || this.length)) {
        tempArr.push(this[i]);
      }
    }
    if(size === 1) {
      return tempArr[~~(Math.random()*tempArr.length)];
    }
    const returnArr = new Array(size);
    for(let i = 0; i < size; i++) {
      returnArr[i] = tempArr[~~(Math.random()*tempArr.length)];
    }
    return returnArr;
  };
  Array.prototype.allToLowerCase = function() {
    return this.map(val => val && val.toLowerCase ? val.toLowerCase() : val);
  };
  Array.prototype.allToUpperCase = function() {
    return this.map(val => val && val.toUpperCase ? val.toUpperCase() : val);
  };

  /* Map iterator */
  Object.getPrototypeOf(new Map().keys()).array = function() {
    return Array.from(this);
  };
}

module.exports = extend;