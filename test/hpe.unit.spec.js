'use strict';
import _ from 'lodash';
import chai from 'chai';
import Hpe from '../index';

const expect = chai.expect;

describe('HPE API Integration', function () {
  it.only('Should return success for authentication', function (done) {
    Hpe
      .session()
      .subscribe(session => {
          expect(session).to.have.property('request');
          done();
        },
        error => done(error));
  });

  it('Should return success for create server', function (done) {
    Hpe
      .session()
      .flatMap(session => {
        const data = {
          name: _.uniqueId("ci-server-"),
          instance_id: _.uniqueId("instance-id-")
        };

        return Hpe.createServer(session, data);
      })
      .subscribe(server => {
          done();
        },

        error => done(error));
  });
});
