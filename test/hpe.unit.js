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
    serverId: undefined,
    serverInstanceId: undefined,
    pipelineId: undefined,
    rootJobBuildId: undefined,
    rootJobStartTime: undefined
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
    const serverName = Util.format('Codefresh %d', _.now());
    const serverInstanceId = _.kebabCase(serverName);

    const server = {
      instanceId: serverInstanceId,
      name: serverName
    };

    Hpe
      .createServer(mock.session, server)
      .subscribe(function (response) {
          expect(response.id).to.be.a('number');
          expect(response.instance_id).to.equal(server.instanceId);
          expect(response.name).to.equal(server.name);
          expect(response.server_type).to.equal('Codefresh');

          mock.serverId = response.id;
          mock.serverInstanceId = response.instance_id;
          done();
        },
        error => done(error));
  });

  it('3-create-pipeline', function (done) {
    const pipelineName = Util.format('Pipeline %d', _.now());
    const pipelineId = _.kebabCase(pipelineName);

    const pipeline = {
      id: pipelineId,
      name: pipelineName,
      serverId: mock.serverId
    };

    Hpe
      .createPipeline(mock.session, pipeline)
      .subscribe(function(response) {
          expect(response.id).to.be.a('number');
          expect(response.root_job.id).to.be.a('number');
          expect(response.ci_server.id).to.equal(mock.serverId);
          expect(response.name).to.equal(pipeline.name);

          const pipelineJobs = HpePipeline.jobs(pipeline.id);
          expect(response.root_job_ci_id).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[0].jobCiId).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[1].jobCiId).to.equal(pipelineJobs[1].jobCiId);
          expect(response.jobs[2].jobCiId).to.equal(pipelineJobs[2].jobCiId);
          expect(response.jobs[3].jobCiId).to.equal(pipelineJobs[3].jobCiId);
          expect(response.jobs[4].jobCiId).to.equal(pipelineJobs[4].jobCiId);
          expect(response.jobs[5].jobCiId).to.equal(pipelineJobs[5].jobCiId);
          expect(response.jobs[6].jobCiId).to.equal(pipelineJobs[6].jobCiId);

          mock.pipelineId = pipeline.id;
          done();
        },
        error => done(error));
  });

  it('4-report-pipeline-running', done => {
    const buildName = Util.format('Build %d', _.now());
    const buildId = _.kebabCase(buildName);

    const stepStatus = {
      stepId: 'root',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: buildId,
      buildName: buildName,
      startTime: _.now(),
      duration: undefined,
      status: 'running',
      result: 'unavailable',
    };

    Hpe
      .reportPipelineStepStatus(mock.session, stepStatus)
      .subscribe(response => {
          mock.rootJobBuildId = stepStatus.buildId;
          mock.rootJobStartTime = stepStatus.startTime;
          done();
        },
        error => done(error));
  });

  function reportPipelineStepStatus(stepId, status, result, done) {
    const stepStatus = {
      stepId: stepId,
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      startTime: mock.rootJobStartTime,
      duration: _.now() - mock.rootJobStartTime,
      status: status,
      result: result,
    };

    Hpe
      .reportPipelineStepStatus(mock.session, stepStatus)
      .subscribe(response => {
          done();
        },
        error => done(error));
  }

  it('5-report-pipeline-clone-repository-finished', done => {
    reportPipelineStepStatus('clone-repository', 'finished', 'success', done);
  });

  it('6-report-pipeline-build-dockerfile-finished', done => {
    reportPipelineStepStatus('build-dockerfile', 'finished', 'success', done);
   });

  it('7-report-pipeline-unit-test-script-finished', done => {
    reportPipelineStepStatus('unit-test-script', 'finished', 'success', done);
  });

  it('8-report-pipeline-push-docker-registry-finished', done => {
    reportPipelineStepStatus('push-docker-registry', 'finished', 'success', done);
  });

  it('9-report-pipeline-build-dockerfile-finished', done => {
    reportPipelineStepStatus('unit-test-script', 'finished', 'success', done);
  });

  it('9-report-pipeline-integration-test-script-finished', done => {
    reportPipelineStepStatus('integration-test-script', 'finished', 'success', done);
  });

  it('9-report-pipeline-deploy-script-finished', done => {
    reportPipelineStepStatus('deploy-script', 'finished', 'success', done);
  });

  it('10-report-pipeline-finished', done => {
    const stepStatus = {
      stepId: 'root',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      startTime: mock.rootJobStartTime,
      duration: _.now() - mock.rootJobStartTime,
      status: 'finished',
      result: 'success',
    };

    Hpe
      .reportPipelineStepStatus(mock.session, stepStatus)
      .subscribe(response => {
          done();
        },
        error => done(error));
  });
});
