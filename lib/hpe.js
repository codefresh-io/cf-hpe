"use strict";

import _ from "lodash";
import Util from "util";
import Rx from "rx";
import Request from 'request';
import RequestRx from "./request-rx";
import Config from "../config.json";

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
    const hpeCookies = Request.jar();
    const hpeRequest = Request.defaults({
      jar: hpeCookies
    });

    const options = {
      uri: Config.hpe.serverUrl + '/authentication/sign_in/',
      json: true,
      body: {
        "user": Config.hpe.user,
        "password": Config.hpe.password
      },
    };

    return RequestRx
      .post(hpeRequest, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        const hpeCsrfToken =
          _(hpeCookies.getCookies(Config.hpe.serverUrl))
            .find(cookie => cookie.key === 'HPSSO_COOKIE_CSRF')
            .value;

        const hpeSession = {
          request: hpeRequest.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': hpeCsrfToken
            }
          })
        };

        return hpeSession;
      });
  }

  static createServer(session, request) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/ci_servers/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);

    request = _.assign(request, {
      server_type: "CodeFresh"
    });

    const options = {
      uri: uri,
      json: true,
      body: {
        data: [request]
      },
    };

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 201) {
          throw new HpeAuthError(response.statusCode);
        }

        return response.body.data[0];
      });
  }

  static createPipeLine() {
    return Rx.Observable.throw(new HpeError("failed"));
  }
}

export default Hpe;
