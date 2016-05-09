/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import './config.env';
import Rx from 'rx';
import Firebase from 'firebase';
import { expect } from 'chai';
import { HpeService } from 'cf-hpe';

describe('HpeService', function () {
  before(function () {
    this.slow(5000);
    this.timeout(15000);

    Rx.Observable
      .start(() => new Firebase(process.env.CF_HPE_FIREBASE_URL))
      .doOnNext(testRootRef => (this.testRootRef = testRootRef))
      .flatMap(testRootRef =>
        testRootRef
          .rx_createAuthToken(process.env.TEST_AUTH_SECRET, process.env.TEST_AUTH_UID)
          .flatMap(authToken => testRootRef.rx_authWithCustomToken(authToken)))
      .subscribe(() => done());
  });

  beforeEach(function () {
  });

  it('Should open a session', function (done) {
    HpeService
      .createService()
      .subscribe(
        session => {
          expect(session).to.have.property('request');
          testSuitState.session = session;
          done();
        },
        error => done(error));
  });
});
