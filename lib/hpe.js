"use strict";

import _ from "lodash";
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
    const session = {
      jar: RequestRx.jar()
    };

    const options = _.assign(session, {
      uri: config.hpe.serverUrl + "/authentication/sign_in",
      json: true,
      body: {
        "user": config.hpe.user,
        "password": config.hpe.password
      },
    });

    return RequestRx
      .post(options)
      .map(response => {
        if(response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        return session;
      });
  }

  static createServer(session, data) {
    const uri = util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/ci_servers/$s',
      config.hpe.serverUrl,
      session.sharedSpace,
      session.workspace,
      id);

    const options = _.assign(session, {
      uri: uri,
      json: true,
      body: {
        data: [data]
      },
    });

    return RequestRx
      .post(options)
      .map(response => {
        if(response.statusCode !== 200) {
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
