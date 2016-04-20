"use strict";

import _ from "lodash";
import util from "util";
import request from 'request';
import Rx from "rx";
import RequestRx from "./request-rx";
import config from "../config.json";

class HpeError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class HpeAuthError extends HpeError {
  constructor(statusCode) {
    super("HpeAuthError", statusCode);
  }
}

class Hpe {
  static session() {
    const jar = request.jar();
    const session = {
      cookieJar: jar,
      request: request.defaults({
        jar: jar
      })
    };

    const options = {
      uri: config.hpe.serverUrl + '/authentication/sign_in/',
      json: true,
      body: {
        "user": config.hpe.user,
        "password": config.hpe.password
      },
    };

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }


        return session;
      });
  }

  static createServer(session, data) {
    const uri = util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/ci_servers/',
      config.hpe.serverUrl,
      config.hpe.sharedSpace,
      config.hpe.workspace);

    data = _.assign(data, {
      server_type: "CodeFresh"
    });

    const options = {
      uri: uri,
      json: true,
      body: {
        data: [data]
      },
    };

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        return response.body;
      });
  }

  static getCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static createPipeLine() {
    return Rx.Observable.throw(new HpeError("failed"));
  }
}

export default Hpe;
