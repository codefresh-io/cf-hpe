/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import _ from 'lodash';
import { expect } from 'chai';
import BuildEvents from 'app/build-events';

describe('BuildEvents', function () {
  this.slow(2000);
  this.timeout(30000);

  it.only('Should receive builds events', function (done) {
    BuildEvents
      .create()
      .doOnNext(buildEvent => {

      })
      .doOnError(error => done(error))
      .subscribe();
  });

  it('Should find account using account id', function (done) {
    const accountId = '5714840d088bc00600c22f3a';

    BuildEvents
      .findAccount(accountId)
      .doOnNext(account => {
        expect(account._id).to.exist;
      })
      .finally(() => done())
      .subscribe();
  });

  it('Should find service using progress id', function (done) {
    const progressId = '5718d772a10b7206000937cf';

    BuildEvents
      .findServiceByProgressId(progressId)
      .doOnNext(service => {
        expect(service._id).to.exist;
      })
      .finally(() => done())
      .subscribe();
  });
});
