'use strict';
import _ from 'lodash';
import util from 'util';
import Chai from 'chai';
import uuid from 'node-uuid';
import Hpe from '../index';

const expect = Chai.expect;

describe('HPE API Integration', function () {
  it('Should return success for authentication', function (done) {
    Hpe
      .session()
      .subscribe(session => {
          expect(session).to.have.property('request');
          done();
        },
        error => done(error));
  });

  it.only('Should return success for create server', function (done) {
    Hpe
      .session()
      .flatMap(session => {
        const data = {
          name: util.format("ci-server-%d", _.now()),
          instance_id: uuid.v1()
        };

        return Hpe.createServer(session, data);
      })
      .subscribe(server => {
          done();
        },

        error => done(error));
  });
});
