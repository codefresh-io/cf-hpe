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
    rootJobId: undefined
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

          mock.serverId = response.id;
          mock.serverInstanceId = response.instance_id;
          done();
        },
        error => done(error));
  });

  it('3-create-pipeline', function (done) {
    const name = Util.format('Codefresh %d', _.now());
    const pipeline = {
      id:_.kebabCase(name),
      name: name,
      serverId: mock.serverId
    };

    Hpe
      .createPipeline(mock.session, pipeline)
      .subscribe(function(response) {
          expect(response.id).to.be.a('number');
          expect(response.root_job.id).to.be.a('number');
          expect(response.ci_server.id).to.equal(mock.serverId);
          expect(response.name).to.equal(pipeline.name);

          const pipelineid = _.kebabCase(pipeline.name);
          const pipelineJobs = HpePipeline.jobs(pipelineid);

          expect(response.root_job_ci_id).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[0].jobCiId).to.equal(pipelineJobs[0].jobCiId);
          expect(response.jobs[1].jobCiId).to.equal(pipelineJobs[1].jobCiId);
          expect(response.jobs[2].jobCiId).to.equal(pipelineJobs[2].jobCiId);
          expect(response.jobs[3].jobCiId).to.equal(pipelineJobs[3].jobCiId);
          expect(response.jobs[4].jobCiId).to.equal(pipelineJobs[4].jobCiId);
          expect(response.jobs[5].jobCiId).to.equal(pipelineJobs[5].jobCiId);
          expect(response.jobs[6].jobCiId).to.equal(pipelineJobs[6].jobCiId);

          mock.rootJobId = response.root_job_ci_id;
          done();
        },
        error => done(error));
  });

  it.skip('4-report-pipeline-start', done => {
    const stepStatus = {
      serverInstanceId: mock.serverInstanceId,
      pipelineid: mock.rootJobId
    };

    Hpe
      .startPipelineBuild(mock.session, build)
      .subscribe(response => {

          done();
        },
        error => done(error));
  });
});
