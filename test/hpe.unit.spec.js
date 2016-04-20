'use strict';
import chai from 'chai';
import Hpe from '../index';

const expect = chai.expect;

describe('HPE API Integration', function () {
  it('Should return success for authentication', function (done) {
    Hpe
      .session()
      .subscribe(session => {
          expect(session).to.be.a('object');
          expect(session).to.have.property('jar');

          done();
        },
        error => done(error));
  });

  it('Should return success create server', function (done) {
    Hpe
      .session()
      .flatMap(session => {
        const data = {

        };
        Hpe.createServer(session, data);
      }
          expect(session).to.be.a('object');
          expect(session).to.have.property('jar');

          done();
        },
        error => done(error));
  });
});
