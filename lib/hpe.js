"use strict";

import _ from "lodash";
import util from "util";
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

    const options = {
      json: true,
      uri: config.hpe.serverUrl + '/authentication/sign_in/',
      body: {
        "user": config.hpe.user,
        "password": config.hpe.password
      },
    };

    return RequestRx
      .post(options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        return session;
      });
  }

  static createServer(session, data) {
    const uri = util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/ci_servers/$s',
      config.hpe.serverUrl,
      config.hpe.sharedSpace,
      config.hpe.workspace,
      id);

    data = _.assign(data, {
      server_type: "CodeFresh"
    });

    const options = _.assign(session, {
      uri: uri,
      json: true,
      body: {
        data: [data]
      },
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
