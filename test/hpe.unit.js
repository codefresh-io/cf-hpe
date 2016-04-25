'use strict';
import _ from 'lodash';
import Util from 'util';
import Chai from 'chai';
import Uuid from 'node-uuid';
import Hpe from '../index';

const expect = Chai.expect;

describe('Hpe', function () {
  this.timeout(5000);
  const mock = {
    session: undefined,
    serverID: undefined,
    rootJobID: undefined
  };

  it('1-session', function (done) {
    Hpe
      .session()
      .subscribe(function(session) {
          expect(session).to.have.property('request');
          mock.session = session;
          done();
        },
        error => done(error));
  });

  it('2-create-server', function (done) {
    const server = {
      name: Util.format('Codefresh %d', _.now())
    };

    Hpe
      .createServer(mock.session, server)
      .subscribe(function (response) {
          expect(response.id).to.be.a('number');
          expect(response.name).to.equal(server.name);
          expect(response.instance_id).to.equal(_.kebabCase(server.name));
          expect(response.server_type).to.equal('Codefresh');

          mock.serverID = response.id;
          mock.serverInstanceID = response.instance_id;
          done();
        },

        error => done(error));
  });

  it('3-create-pipeline', function (done) {
    const pipeline = {
      serverID: mock.serverID,
      name: Util.format('Codefresh %d', _.now()),
    };

    Hpe
      .createPipeline(mock.session, pipeline)
      .subscribe(function(response) {
          expect(response.id).to.be.a('number');
          expect(response.root_job.id).to.be.a('number');
          expect(response.ci_server.id).to.equal(mock.serverID);
          expect(response.name).to.equal(pipeline.name);

          const rootJobID = 'root-' + _.kebabCase(pipeline.name);
          expect(response.root_job_ci_id).to.equal(rootJobID);
          expect(response.jobs[0].jobCiId).to.equal(rootJobID);
          expect(response.jobs[1].jobCiId).to.equal(rootJobID + '-clone-repository');
          expect(response.jobs[2].jobCiId).to.equal(rootJobID + '-build-dockerfile');
          expect(response.jobs[3].jobCiId).to.equal(rootJobID + '-unit-test-script');
          expect(response.jobs[4].jobCiId).to.equal(rootJobID + '-push-docker-registry');
          expect(response.jobs[5].jobCiId).to.equal(rootJobID + '-integration-test-script');
          expect(response.jobs[6].jobCiId).to.equal(rootJobID + '-deploy-script');

          mock.rootJobID = response.root_job_ci_id;
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
