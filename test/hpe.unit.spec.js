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

  it('Create Pipeline', function (done) {
    const request = {
      name: Util.format('pipeline-%d', _.now()),
      ci_server: {
        type: 'ci_server',
        id: 1001
      },
      root_job_ci_id: "job-ci-id-01",
      jobs: [
        {
          jobCiId: "job-ci-id-01"
        }
      ]
    };

    Hpe
      .session()
      .flatMap(session => Hpe.createPipeline(session, request))
      .subscribe(response => {
          done();
        },

        error => done(error));
  });
});
