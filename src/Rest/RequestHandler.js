const Request = require("./Request.js");
const SequentialBucket = require("../Util/SequentialBucket.js");

class RequestHandler {
  constructor(client) {
    this.client = client;
    this.ratelimited = false;
    this.limiter = new SequentialBucket(this, this.client.options.restTimeOffset);
  }
  request(method, path, options = {}) {
    let APIrequest = new Request(this, method, path, options);
    return new Promise((res, rej) => {
      this.limiter.queue({
        request: APIrequest,
        res,
        rej
      });
    });
  }
  get token() {
    return this.client.token;
  }
}

module.exports = RequestHandler;