"use strict";

class Logger {
  log(message, level) {
    const date = new Date();
    console.log(this.formatMessage(message, level, date));
  }
  error(message) {
    console.error(message);
  }
  formatMessage(message, level, date) {
    return `${date.toLocaleTimeString("en-US")} [${level}] ${message}`;
  }
  logError(message, log) {
    if (log && (message instanceof Error)) {
      message = message.message;
      this.log(message, "ERROR");
    } else if (log) {
      this.log(message, "ERROR");
    } else if (message instanceof Error) {
      var c = this.formatMessage(message.message, "ERROR", new Date());
      this.error(`${c}\n\n${message.stack}`);
    } else {
      this.error(this.formatMessage(message, "ERROR", new Date()));
    }
  }
  logWarning(message) {
    if (message instanceof Error) {
      message = message.message;
      this.log(message, "WARNING");
    }
  }
}

module.exports = new Logger();
