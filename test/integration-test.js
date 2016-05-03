/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import _ from 'lodash';
import Util from 'util';
import { expect } from 'chai';
import Hpe from '../lib/hpe';
import HpePipeline from '../lib/hpe-pipeline';

describe('Hpe Integration', function () {
  this.slow(5000);
  this.timeout(15000);

  const mock = {
    session: undefined,
    serverId: undefined,
    serverInstanceId: undefined,
    pipelineId: undefined,
    rootJobBuildId: undefined,
    rootJobStartTime: undefined,
  };

  it('Should open a session', function (done) {
    Hpe
      .session()
      .subscribe(
        session => {
          expect(session).to.have.property('request');
          mock.session = session;
          done();
        },
        error => done(error));
  });

  it('Should create a CI server', function (done) {
    const serverName = Util.format('Codefresh %d', _.now());
    const serverInstanceId = _.kebabCase(serverName);

    const server = {
      instanceId: serverInstanceId,
      name: serverName,
    };

    Hpe
      .createServer(mock.session, server)
      .subscribe(
        response => {
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

  it('Should create a CI server pipeline ', function (done) {
    const pipelineName = Util.format('Pipeline %d', _.now());
    const pipelineId = _.kebabCase(pipelineName);

    const pipeline = {
      id: pipelineId,
      name: pipelineName,
      serverId: mock.serverId,
    };

    Hpe
      .createPipeline(mock.session, pipeline)
      .subscribe(
        response => {
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
          expect(response.jobs[7].jobCiId).to.equal(pipelineJobs[7].jobCiId);

          mock.pipelineId = pipeline.id;
          done();
        },
        error => done(error));
  });

  it('Should report pipeline status as "running"', function (done) {
    const buildName = Util.format('Build %d', _.now());
    const buildId = _.kebabCase(buildName);

    const stepStatus = {
      stepId: 'root',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId,
      buildName,
      startTime: _.now(),
      duration: undefined,
      status: 'running',
      result: 'unavailable',
    };

    Hpe
      .reportPipelineStepStatus(mock.session, stepStatus)
      .subscribe(
        () => {
          mock.rootJobBuildId = stepStatus.buildId;
          mock.rootJobStartTime = stepStatus.startTime;
          done();
        },
        error => done(error));
  });

  function reportPipelineStepStatus(stepId, status, result, done) {
    const stepStatus = {
      stepId,
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      startTime: mock.rootJobStartTime,
      duration: _.now() - mock.rootJobStartTime,
      status,
      result,
    };

    Hpe
      .reportPipelineStepStatus(mock.session, stepStatus)
      .subscribe(
        () => done(),
        error => done(error));
  }

  it('Should report pipeline step "clone-repository" status as "finished"', function (done) {
    reportPipelineStepStatus('clone-repository', 'finished', 'success', done);
  });

  it('Should report pipeline step "build-dockerfile" status as "finished"', function (done) {
    reportPipelineStepStatus('build-dockerfile', 'finished', 'success', done);
  });

  it('Should report pipeline step "unit-test-script" status as "finished"', function (done) {
    reportPipelineStepStatus('unit-test-script', 'finished', 'success', done);
  });

  it('Should report pipeline step "push-docker-registry" status as "finished"', function (done) {
    reportPipelineStepStatus('push-docker-registry', 'finished', 'success', done);
  });

  it('Should report pipeline step "integration-test-script" status as "finished"', function (done) {
    reportPipelineStepStatus('integration-test-script', 'finished', 'success', done);
  });

  it('Should report pipeline step "security-validation" status as "finished"', function (done) {
    reportPipelineStepStatus('security-validation', 'finished', 'failed', done);
  });

  it('Should report pipeline step "deploy-script" status as "finished"', function (done) {
    reportPipelineStepStatus('deploy-script', 'finished', 'success', done);
  });

  it('Should publish test success results #1', function (done) {
    const testResult = {
      stepId: 'unit-test-script',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      testRuns: [
        {
          testName: 'Should pass unit test #1',
          started: _.now(),
          duration: 1000,
          status: 'Passed',
          package: 'cf-hpe',
          module: 'test-1',
          class: 'hpe',
        },
      ],
    };

    Hpe
      .reportPipelineTestResults(mock.session, testResult)
      .subscribe(() => done(),
        error => done(error));
  });

  it('Should publish test failed results #2', function (done) {
    const testResult = {
      stepId: 'unit-test-script',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      testRuns: [
        {
          testName: 'Should pass unit test #2',
          started: _.now(),
          duration: 1000,
          status: 'Failed',
          package: 'cf-hpe',
          module: 'test-1',
          class: 'hpe',
        },
      ],
    };

    Hpe
      .reportPipelineTestResults(mock.session, testResult)
      .subscribe(() => done(),
        error => done(error));
  });

  it('Should publish test success results #3', function (done) {
    const testResult = {
      stepId: 'integration-test-script',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      testRuns: [
        {
          testName: 'Should pass integration test #1',
          started: _.now(),
          duration: 1000,
          status: 'Passed',
          package: 'cf-hpe',
          module: 'test-2',
          class: 'hpe',
        },
      ],
    };

    Hpe
      .reportPipelineTestResults(mock.session, testResult)
      .subscribe(() => done(),
        error => done(error));
  });

  it('Should publish test failed results #4', function (done) {
    const testResult = {
      stepId: 'integration-test-script',
      serverInstanceId: mock.serverInstanceId,
      pipelineId: mock.pipelineId,
      buildId: mock.rootJobBuildId,
      testRuns: [
        {
          testName: 'Should pass integration test #2',
          started: _.now(),
          duration: 1000,
          status: 'Failed',
          package: 'cf-hpe',
          module: 'test-2',
          class: 'hpe',
        },
      ],
    };

    Hpe
      .reportPipelineTestResults(mock.session, testResult)
      .subscribe(() => done(),
        error => done(error));
  });

  it('Should report pipeline status as "finished"', function (done) {
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
      .subscribe(() => done(),
        error => done(error));
  });
});
