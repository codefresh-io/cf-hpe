'use strict';
import _ from 'lodash';
import Util from 'util';
import Chai from 'chai';
import Hpe from '../lib/hpe';
import HpePipeline from '../lib/hpe-pipeline';

const expect = Chai.expect;

describe('Hpe', function () {
  this.timeout(5000);
  const mock = {
    session: undefined,
    serverID: undefined,
    serverInstanceID: undefined,
    rootJobID: undefined
  };

  it('1-session', done => {
    Hpe
      .session()
      .subscribe(function(session) {
          expect(session).to.have.property('request');
          mock.session = session;
          done();
        },
        error => done(error));
  });

  it('2-create-server', done => {
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

          const pipelineID = _.kebabCase(pipeline.name);
          const pipelineJobs = HpePipeline.jobs(pipelineID);

          expect(response.root_job_ci_id).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[0].jobCiId).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[1].jobCiId).to.equal(pipelineJobs[1].jobCiId);
          expect(response.jobs[2].jobCiId).to.equal(pipelineJobs[2].jobCiId);
          expect(response.jobs[3].jobCiId).to.equal(pipelineJobs[3].jobCiId);
          expect(response.jobs[4].jobCiId).to.equal(pipelineJobs[4].jobCiId);
          expect(response.jobs[5].jobCiId).to.equal(pipelineJobs[5].jobCiId);
          expect(response.jobs[6].jobCiId).to.equal(pipelineJobs[6].jobCiId);

          mock.rootJobID = response.root_job_ci_id;
          done();
        },
        error => done(error));
  });

  it.skip('4-start-pipeline-build', done => {
    const build = {
      serverID: mock.serverInstanceID,
      jobID: mock.rootJobID
    };

    Hpe
      .startPipelineBuild(mock.session, build)
      .subscribe(response => {

          done();
        },
        error => done(error));
  });

  it.skip('5-report-pipeline-build', done => {
    const build = {
      serverID: mock.serverInstanceID,
      jobID: mock.rootJobID,
      startTime: _.now(),
      duration: 1000,
      status: 'finished',
      result: 'success',
    };

    Hpe
      .reportPipelineBuildStatus(mock.session, build)
      .subscribe(response => {

          done();
        },
        error => done(error));
  });
});
