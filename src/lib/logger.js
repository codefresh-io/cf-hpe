/* eslint-disable no-console */
import util from 'util';

class Logger {
  static getLogger(category) {
    return new Logger(category);
  }

  constructor(category) {
    this.category = category;
  }

  debug(message, ...values) {
    this.log('debug', util.format(message, ...values));
  }

  info(message, ...values) {
    this.log('info', util.format(message, ...values));
  }

  warn(message, ...values) {
    this.log('warn', util.format(message, ...values));
  }

  error(message, ...values) {
    this.log('error', util.format(message, ...values));
  }

  exception(error) {
    this.log('error', error.stack);
  }

  log(level, message) {
    const format = util.format(
      '[%s] [%s] %s - %s',
      new Date().toISOString(),
      level,
      this.category,
      message);
    console[level](format);
  }
}

export default Logger;
