'use strict';
import _ from 'lodash';
import Util from 'util';
import Chai from 'chai';
import Uuid from 'node-uuid';
import Hpe from '../index';

const expect = Chai.expect;

describe('Hpe', function () {
  before(function() {
    this.timeout(5000);
    this.mock = {
      session: undefined,
      serverID: undefined
    };

  });

  it('1-session', function (done) {
    Hpe
      .session()
      .subscribe(session => {
          expect(session).to.have.property('request');
          this.mock.session = session;
          done();
        },
        error => done(error));
  });

  it('2-create-server', function (done) {
    const server = {
      name: Util.format('Codefresh %d', _.now())
    };

    Hpe
      .createServer(this.mock.session, server)
      .subscribe(response => {
          expect(response.id).to.be.a('number');
          expect(response.name).to.equal(server.name);
          expect(response.instance_id).to.equal(_.kebabCase(server.name));
          expect(response.server_type).to.equal('Codefresh');

          this.mock.serverID = response.id;
          this.mock.serverInstanceID = response.instance_id;

          done();
        },

        error => done(error));
  });

  it('3-create-pipeline', function (done) {
    const pipeline = {
      serverID: this.mock.serverID,
      name: Util.format('Pipeline %d', _.now()),
    };

    Hpe
      .createPipeline(this.mock.session, pipeline)
      .subscribe(response => {
          expect(response.id).to.be.a('number');
          expect(response.root_job.id).to.be.a('number');
          expect(response.ci_server.id).to.equal(this.mock.serverID);
          expect(response.name).to.equal(pipeline.name);
          done();
        },

        error => done(error));
  });

  it.skip('4-report-pipeline-build', function (done) {
    const serverInstanceID = 1018;
    const pipelineName = Util.format('pipeline-%d', _.now());
    const rootJobName = Util.format('pipeline-job-%d', _.now());

    const request = {
      serverCiId: serverInstanceID,
      jobCiId: "string",
      buildCiId: "string",
      buildName: "string",
      startTime: _.now(),
      duration: 1000,
      status: "running",
      result: "success",
      "parameters": [
        {
          "name": "string",
          "type": "boolean",
          "description": "string",
          "choices": [
            "string"
          ],
          "defaultValue": "string",
          "value": "string"
        }
      ],
      "causes": [
        {
          "jobCiId": "string",
          "buildCiId": "string"
        }
      ]
    };

    Hpe
      .session()
      .flatMap(session => Hpe.createPipeline(session, request))
      .subscribe(response => {
          expect(response.ci_server.id).to.equal(serverID);
          expect(response.name).to.equal(pipelineName);
          done();
        },

        error => done(error));
  });
});
