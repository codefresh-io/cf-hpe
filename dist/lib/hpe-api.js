'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpeApi = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _xml2js = require('xml2js');

var _xml2js2 = _interopRequireDefault(_xml2js);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _requestRx = require('./request-rx');

var _hpeApiError = require('./hpe-api-error');

var _hpeApiPipeline = require('./hpe-api-pipeline');

var _hpeApiConfig = require('./hpe-api-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HpeApi = exports.HpeApi = function () {
  function HpeApi() {
    _classCallCheck(this, HpeApi);
  }

  _createClass(HpeApi, null, [{
    key: 'connect',
    value: function connect() {
      var jar = _request2.default.jar();
      var signInRequest = _request2.default.defaults({ jar: jar });
      var options = {
        uri: _util2.default.format('%s/authentication/sign_in/', _hpeApiConfig.hpeApiConfig.hpeServerUrl),
        json: true,
        body: {
          user: _hpeApiConfig.hpeApiConfig.hpeUser,
          password: '=211cb1cdb045df37I'
        }
      };

      return _requestRx.RequestRx.post(signInRequest, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        var csrfToken = (0, _lodash2.default)(jar.getCookies(_hpeApiConfig.hpeApiConfig.hpeServerUrl)).find(function (cookie) {
          return cookie.key === 'HPSSO_COOKIE_CSRF';
        }).value;

        return {
          hpeApiConfig: _hpeApiConfig.hpeApiConfig,
          request: signInRequest.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': csrfToken
            }
          })
        };
      });
    }
  }, {
    key: '_getWorkspaceUri',
    value: function _getWorkspaceUri(session) {
      return _util2.default.format('%s/api/shared_spaces/%s/workspaces/%s', session.hpeApiConfig.hpeServerUrl, session.hpeApiConfig.hpeSharedSpace, session.hpeApiConfig.hpeWorkspace);
    }
  }, {
    key: 'findCiServer',
    value: function findCiServer(session, instanceId) {
      var options = {
        uri: _util2.default.format('%s/ci_servers/', HpeApi._getWorkspaceUri(session)),
        json: true
      };

      return _requestRx.RequestRx.get(session.request, options).flatMap(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _rx2.default.Observable.from(response.body.data).first(function (ciServer) {
          return ciServer.instance_id === instanceId;
        }, null, null);
      });
    }
  }, {
    key: 'createCiServer',
    value: function createCiServer(session, server) {
      var data = {
        instance_id: server.instanceId,
        name: server.name,
        url: 'http://codefresh.io/',
        server_type: 'Codefresh'
      };

      var options = {
        uri: _util2.default.format('%s/ci_servers/', HpeApi._getWorkspaceUri(session)),
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx.RequestRx.post(session.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'createPipeline',
    value: function createPipeline(session, pipeline) {
      var pipelineJobs = _hpeApiPipeline.HpeApiPipeline.jobs(pipeline.id);
      var data = {
        name: pipeline.name,
        root_job_ci_id: pipelineJobs[0].jobCiId,
        ci_server: {
          type: 'ci_server',
          id: pipeline.serverId
        },
        jobs: pipelineJobs
      };

      var options = {
        uri: _util2.default.format('%s/pipelines/', HpeApi._getWorkspaceUri(session)),
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx.RequestRx.post(session.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'reportPipelineStepStatus',
    value: function reportPipelineStepStatus(session, stepStatus) {
      var jobCiId = _hpeApiPipeline.HpeApiPipeline.jobId(stepStatus.pipelineId, stepStatus.stepId);
      var rootJobCiId = _hpeApiPipeline.HpeApiPipeline.jobId(stepStatus.pipelineId, 'pipeline');

      var data = {
        serverCiId: stepStatus.serverInstanceId,
        jobCiId: jobCiId,
        buildCiId: stepStatus.buildId,
        buildName: stepStatus.buildName,
        startTime: stepStatus.startTime,
        duration: stepStatus.duration,
        status: stepStatus.status,
        result: stepStatus.result
      };

      if (jobCiId !== rootJobCiId) {
        data.causes = [{
          jobCiId: rootJobCiId,
          buildCiId: stepStatus.buildId
        }];
      }

      var options = {
        uri: _util2.default.format('%s/analytics/ci/builds/', HpeApi._getWorkspaceUri(session)),
        json: true,
        body: data
      };

      return _requestRx.RequestRx.put(session.request, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }, {
    key: 'reportPipelineTestResults',
    value: function reportPipelineTestResults(session, testResult) {
      var jobCiId = _hpeApiPipeline.HpeApiPipeline.jobId(testResult.pipelineId, testResult.stepId);
      var builder = new _xml2js2.default.Builder();
      var data = builder.buildObject({
        test_result: {
          build: {
            $: {
              server_id: testResult.serverInstanceId,
              job_id: jobCiId,
              job_name: jobCiId,
              build_id: testResult.buildId,
              build_name: testResult.buildId
            }
          },
          test_runs: {
            test_run: {
              $: {
                name: testResult.testRuns[0].testName,
                started: testResult.testRuns[0].started,
                duration: testResult.testRuns[0].duration,
                status: testResult.testRuns[0].status,
                module: testResult.testRuns[0].module,
                package: testResult.testRuns[0].package,
                class: testResult.testRuns[0].class
              }
            }
          }
        }
      });

      var options = {
        uri: _util2.default.format('%s/test-results/', HpeApi._getWorkspaceUri(session)),
        'content-type': 'application/xml',
        body: data
      };

      return _requestRx.RequestRx.post(session.request, options).map(function (response) {
        if (response.statusCode !== 202) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }]);

  return HpeApi;
}();
//# sourceMappingURL=data:application/json;base64,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QUFDL0IsZ0JBQU0sNkJBQ0osU0FBUyxVQURMLEVBRUosS0FBSyxTQUFMLENBQWUsU0FBUyxJQUF4QixFQUE4QixJQUE5QixFQUFvQyxDQUFwQyxDQUZJLENBQU47QUFHRDs7QUFFRCxlQUFPLGlCQUFFLE1BQUYsQ0FBUyxFQUFULEVBQWEsU0FBUyxJQUF0QixFQUE0QixJQUE1QixDQUFQO0FBQ0QsT0FWSSxDQUFQO0FBV0QiLCJmaWxlIjoibGliL2hwZS1hcGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFJ4IGZyb20gJ3J4JztcbmltcG9ydCBVdGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IFhtbDJqcyBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdCc7XG5pbXBvcnQgeyBSZXF1ZXN0UnggfSBmcm9tICdsaWIvcmVxdWVzdC1yeCc7XG5pbXBvcnQgeyBIcGVBcGlFcnJvciB9IGZyb20gJ2xpYi9ocGUtYXBpLWVycm9yJztcbmltcG9ydCB7IEhwZUFwaVBpcGVsaW5lIH0gZnJvbSAnbGliL2hwZS1hcGktcGlwZWxpbmUnO1xuaW1wb3J0IHsgaHBlQXBpQ29uZmlnIH0gZnJvbSAnLi9ocGUtYXBpLWNvbmZpZyc7XG5cbmV4cG9ydCBjbGFzcyBIcGVBcGkge1xuXG4gIHN0YXRpYyBjb25uZWN0KCkge1xuICAgIGNvbnN0IGphciA9IHJlcXVlc3QuamFyKCk7XG4gICAgY29uc3Qgc2lnbkluUmVxdWVzdCA9IHJlcXVlc3QuZGVmYXVsdHMoeyBqYXIgfSk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIHVyaTogVXRpbC5mb3JtYXQoJyVzL2F1dGhlbnRpY2F0aW9uL3NpZ25faW4vJywgaHBlQXBpQ29uZmlnLmhwZVNlcnZlclVybCksXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keToge1xuICAgICAgICB1c2VyOiBocGVBcGlDb25maWcuaHBlVXNlcixcbiAgICAgICAgcGFzc3dvcmQ6ICc9MjExY2IxY2RiMDQ1ZGYzN0knLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIFJlcXVlc3RSeFxuICAgICAgLnBvc3Qoc2lnbkluUmVxdWVzdCwgb3B0aW9ucylcbiAgICAgIC5tYXAocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEhwZUFwaUVycm9yKFxuICAgICAgICAgICAgcmVzcG9uc2Uuc3RhdHVzQ29kZSxcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmJvZHksIG51bGwsIDIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNzcmZUb2tlbiA9XG4gICAgICAgICAgXyhqYXIuZ2V0Q29va2llcyhocGVBcGlDb25maWcuaHBlU2VydmVyVXJsKSlcbiAgICAgICAgICAgIC5maW5kKGNvb2tpZSA9PiBjb29raWUua2V5ID09PSAnSFBTU09fQ09PS0lFX0NTUkYnKVxuICAgICAgICAgICAgLnZhbHVlO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaHBlQXBpQ29uZmlnLFxuICAgICAgICAgIHJlcXVlc3Q6IHNpZ25JblJlcXVlc3QuZGVmYXVsdHMoe1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnSFBTU08tSEVBREVSLUNTUkYnOiBjc3JmVG9rZW4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgX2dldFdvcmtzcGFjZVVyaShzZXNzaW9uKSB7XG4gICAgcmV0dXJuIFV0aWwuZm9ybWF0KFxuICAgICAgJyVzL2FwaS9zaGFyZWRfc3BhY2VzLyVzL3dvcmtzcGFjZXMvJXMnLFxuICAgICAgc2Vzc2lvbi5ocGVBcGlDb25maWcuaHBlU2VydmVyVXJsLFxuICAgICAgc2Vzc2lvbi5ocGVBcGlDb25maWcuaHBlU2hhcmVkU3BhY2UsXG4gICAgICBzZXNzaW9uLmhwZUFwaUNvbmZpZy5ocGVXb3Jrc3BhY2UpO1xuICB9XG5cbiAgc3RhdGljIGZpbmRDaVNlcnZlcihzZXNzaW9uLCBpbnN0YW5jZUlkKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIHVyaTogVXRpbC5mb3JtYXQoJyVzL2NpX3NlcnZlcnMvJywgSHBlQXBpLl9nZXRXb3Jrc3BhY2VVcmkoc2Vzc2lvbikpLFxuICAgICAganNvbjogdHJ1ZSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIFJlcXVlc3RSeFxuICAgICAgLmdldChzZXNzaW9uLnJlcXVlc3QsIG9wdGlvbnMpXG4gICAgICAuZmxhdE1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSHBlQXBpRXJyb3IoXG4gICAgICAgICAgICByZXNwb25zZS5zdGF0dXNDb2RlLFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuYm9keSwgbnVsbCwgMikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGVcbiAgICAgICAgICAuZnJvbShyZXNwb25zZS5ib2R5LmRhdGEpXG4gICAgICAgICAgLmZpcnN0KGNpU2VydmVyID0+IGNpU2VydmVyLmluc3RhbmNlX2lkID09PSBpbnN0YW5jZUlkLCBudWxsLCBudWxsKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUNpU2VydmVyKHNlc3Npb24sIHNlcnZlcikge1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICBpbnN0YW5jZV9pZDogc2VydmVyLmluc3RhbmNlSWQsXG4gICAgICBuYW1lOiBzZXJ2ZXIubmFtZSxcbiAgICAgIHVybDogJ2h0dHA6Ly9jb2RlZnJlc2guaW8vJyxcbiAgICAgIHNlcnZlcl90eXBlOiAnQ29kZWZyZXNoJyxcbiAgICB9O1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIHVyaTogVXRpbC5mb3JtYXQoJyVzL2NpX3NlcnZlcnMvJywgSHBlQXBpLl9nZXRXb3Jrc3BhY2VVcmkoc2Vzc2lvbikpLFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGF0YTogW2RhdGFdLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIFJlcXVlc3RSeFxuICAgICAgLnBvc3Qoc2Vzc2lvbi5yZXF1ZXN0LCBvcHRpb25zKVxuICAgICAgLm1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSHBlQXBpRXJyb3IoXG4gICAgICAgICAgICByZXNwb25zZS5zdGF0dXNDb2RlLFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuYm9keSwgbnVsbCwgMikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uYXNzaWduKHt9LCByZXNwb25zZS5ib2R5LmRhdGFbMF0sIGRhdGEpO1xuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlUGlwZWxpbmUoc2Vzc2lvbiwgcGlwZWxpbmUpIHtcbiAgICBjb25zdCBwaXBlbGluZUpvYnMgPSBIcGVBcGlQaXBlbGluZS5qb2JzKHBpcGVsaW5lLmlkKTtcbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgbmFtZTogcGlwZWxpbmUubmFtZSxcbiAgICAgIHJvb3Rfam9iX2NpX2lkOiBwaXBlbGluZUpvYnNbMF0uam9iQ2lJZCxcbiAgICAgIGNpX3NlcnZlcjoge1xuICAgICAgICB0eXBlOiAnY2lfc2VydmVyJyxcbiAgICAgICAgaWQ6IHBpcGVsaW5lLnNlcnZlcklkLFxuICAgICAgfSxcbiAgICAgIGpvYnM6IHBpcGVsaW5lSm9icyxcbiAgICB9O1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIHVyaTogVXRpbC5mb3JtYXQoJyVzL3BpcGVsaW5lcy8nLCBIcGVBcGkuX2dldFdvcmtzcGFjZVVyaShzZXNzaW9uKSksXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keToge1xuICAgICAgICBkYXRhOiBbZGF0YV0sXG4gICAgICB9LFxuICAgIH07XG5cbiAgICByZXR1cm4gUmVxdWVzdFJ4XG4gICAgICAucG9zdChzZXNzaW9uLnJlcXVlc3QsIG9wdGlvbnMpXG4gICAgICAubWFwKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICAgIHRocm93IG5ldyBIcGVBcGlFcnJvcihcbiAgICAgICAgICAgIHJlc3BvbnNlLnN0YXR1c0NvZGUsXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5ib2R5LCBudWxsLCAyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gXy5hc3NpZ24oe30sIHJlc3BvbnNlLmJvZHkuZGF0YVswXSwgZGF0YSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyByZXBvcnRQaXBlbGluZVN0ZXBTdGF0dXMoc2Vzc2lvbiwgc3RlcFN0YXR1cykge1xuICAgIGNvbnN0IGpvYkNpSWQgPSBIcGVBcGlQaXBlbGluZS5qb2JJZChzdGVwU3RhdHVzLnBpcGVsaW5lSWQsIHN0ZXBTdGF0dXMuc3RlcElkKTtcbiAgICBjb25zdCByb290Sm9iQ2lJZCA9IEhwZUFwaVBpcGVsaW5lLmpvYklkKHN0ZXBTdGF0dXMucGlwZWxpbmVJZCwgJ3BpcGVsaW5lJyk7XG5cbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgc2VydmVyQ2lJZDogc3RlcFN0YXR1cy5zZXJ2ZXJJbnN0YW5jZUlkLFxuICAgICAgam9iQ2lJZCxcbiAgICAgIGJ1aWxkQ2lJZDogc3RlcFN0YXR1cy5idWlsZElkLFxuICAgICAgYnVpbGROYW1lOiBzdGVwU3RhdHVzLmJ1aWxkTmFtZSxcbiAgICAgIHN0YXJ0VGltZTogc3RlcFN0YXR1cy5zdGFydFRpbWUsXG4gICAgICBkdXJhdGlvbjogc3RlcFN0YXR1cy5kdXJhdGlvbixcbiAgICAgIHN0YXR1czogc3RlcFN0YXR1cy5zdGF0dXMsXG4gICAgICByZXN1bHQ6IHN0ZXBTdGF0dXMucmVzdWx0LFxuICAgIH07XG5cbiAgICBpZiAoam9iQ2lJZCAhPT0gcm9vdEpvYkNpSWQpIHtcbiAgICAgIGRhdGEuY2F1c2VzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgam9iQ2lJZDogcm9vdEpvYkNpSWQsXG4gICAgICAgICAgYnVpbGRDaUlkOiBzdGVwU3RhdHVzLmJ1aWxkSWQsXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgIH1cblxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICB1cmk6IFV0aWwuZm9ybWF0KCclcy9hbmFseXRpY3MvY2kvYnVpbGRzLycsIEhwZUFwaS5fZ2V0V29ya3NwYWNlVXJpKHNlc3Npb24pKSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiBkYXRhLFxuICAgIH07XG5cbiAgICByZXR1cm4gUmVxdWVzdFJ4XG4gICAgICAucHV0KHNlc3Npb24ucmVxdWVzdCwgb3B0aW9ucylcbiAgICAgIC5tYXAocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEhwZUFwaUVycm9yKFxuICAgICAgICAgICAgcmVzcG9uc2Uuc3RhdHVzQ29kZSxcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmJvZHksIG51bGwsIDIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfLmFzc2lnbih7fSwgcmVzcG9uc2UuYm9keSwgZGF0YSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyByZXBvcnRQaXBlbGluZVRlc3RSZXN1bHRzKHNlc3Npb24sIHRlc3RSZXN1bHQpIHtcbiAgICBjb25zdCBqb2JDaUlkID0gSHBlQXBpUGlwZWxpbmUuam9iSWQodGVzdFJlc3VsdC5waXBlbGluZUlkLCB0ZXN0UmVzdWx0LnN0ZXBJZCk7XG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBYbWwyanMuQnVpbGRlcigpO1xuICAgIGNvbnN0IGRhdGEgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KHtcbiAgICAgIHRlc3RfcmVzdWx0OiB7XG4gICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgJDoge1xuICAgICAgICAgICAgc2VydmVyX2lkOiB0ZXN0UmVzdWx0LnNlcnZlckluc3RhbmNlSWQsXG4gICAgICAgICAgICBqb2JfaWQ6IGpvYkNpSWQsXG4gICAgICAgICAgICBqb2JfbmFtZTogam9iQ2lJZCxcbiAgICAgICAgICAgIGJ1aWxkX2lkOiB0ZXN0UmVzdWx0LmJ1aWxkSWQsXG4gICAgICAgICAgICBidWlsZF9uYW1lOiB0ZXN0UmVzdWx0LmJ1aWxkSWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdF9ydW5zOiB7XG4gICAgICAgICAgdGVzdF9ydW46IHtcbiAgICAgICAgICAgICQ6IHtcbiAgICAgICAgICAgICAgbmFtZTogdGVzdFJlc3VsdC50ZXN0UnVuc1swXS50ZXN0TmFtZSxcbiAgICAgICAgICAgICAgc3RhcnRlZDogdGVzdFJlc3VsdC50ZXN0UnVuc1swXS5zdGFydGVkLFxuICAgICAgICAgICAgICBkdXJhdGlvbjogdGVzdFJlc3VsdC50ZXN0UnVuc1swXS5kdXJhdGlvbixcbiAgICAgICAgICAgICAgc3RhdHVzOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLnN0YXR1cyxcbiAgICAgICAgICAgICAgbW9kdWxlOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLm1vZHVsZSxcbiAgICAgICAgICAgICAgcGFja2FnZTogdGVzdFJlc3VsdC50ZXN0UnVuc1swXS5wYWNrYWdlLFxuICAgICAgICAgICAgICBjbGFzczogdGVzdFJlc3VsdC50ZXN0UnVuc1swXS5jbGFzcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgdXJpOiBVdGlsLmZvcm1hdCgnJXMvdGVzdC1yZXN1bHRzLycsIEhwZUFwaS5fZ2V0V29ya3NwYWNlVXJpKHNlc3Npb24pKSxcbiAgICAgICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24veG1sJyxcbiAgICAgIGJvZHk6IGRhdGEsXG4gICAgfTtcblxuICAgIHJldHVybiBSZXF1ZXN0UnhcbiAgICAgIC5wb3N0KHNlc3Npb24ucmVxdWVzdCwgb3B0aW9ucylcbiAgICAgIC5tYXAocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSAhPT0gMjAyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEhwZUFwaUVycm9yKFxuICAgICAgICAgICAgcmVzcG9uc2Uuc3RhdHVzQ29kZSxcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmJvZHksIG51bGwsIDIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfLmFzc2lnbih7fSwgcmVzcG9uc2UuYm9keSwgZGF0YSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
