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
    const requestCookies = Request.jar();
    const request = Request.defaults({
      jar: requestCookies
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
      .post(request, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        const csrfToken =
          _(requestCookies.getCookies(Config.hpe.serverUrl))
            .find(cookie => cookie.key === 'HPSSO_COOKIE_CSRF')
            .value;

        const session = {
          request: request.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': csrfToken
            }
          })
        };

        return session;
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

  static createPipeline(session, request) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/pipelines/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);
    
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
}

export default Hpe;
