'use strict';
import _ from 'lodash';
import Util from 'util';
import Chai from 'chai';
import Uuid from 'node-uuid';
import Hpe from '../index';

const expect = Chai.expect;

describe('Hpe Integration', function () {
  it('Authentication', function (done) {
    Hpe
      .session()
      .subscribe(session => {
          expect(session).to.have.property('request');
          done();
        },
        error => done(error));
  });

  it('Create Server', function (done) {
    const request = {
      name: Util.format('ci-server-%d', _.now()),
      instance_id: Uuid.v1()
    };

    Hpe
      .session()
      .flatMap(session => Hpe.createServer(session, request))
      .subscribe(response => {
          expect(response.name).to.equal(request.name);
          expect(response.instance_id).to.equal(request.instance_id);
          expect(response.server_type).to.equal('CodeFresh');
          done();
        },

        error => done(error));
  });

  it.only('Create Pipeline', function (done) {
    this.timeout(5000);
    const serverID = 1001;
    const pipelineName = Util.format('pipeline-%d', _.now());
    const rootJobName = Util.format('pipeline-job-%d', _.now());

    const request = {
      name: pipelineName,
      ci_server: {
        type: 'ci_server',
        id: serverID
      },
      root_job_ci_id: rootJobName,
      jobs: [
        {
          jobCiId: rootJobName,
          name: rootJobName
        },
        {
          jobCiId: "clone-repository",
          name: "Clone Repository"
        },
        {
          jobCiId: "build-dockerfile",
          name: "Build Dockerfile"
        },
        {
          jobCiId: "unit-test-script",
          name: "Unit Test Script"
        },
        {
          jobCiId: "push-docker-registry",
          name: "Push to Docker Registry"
        },
        {
          jobCiId: "integration-test-script",
          name: "Integration Test Script"
        },
        {
          jobCiId: "deploy-script",
          name: "Deploy Script"
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
