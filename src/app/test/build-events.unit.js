/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import { expect } from 'chai';
import BuildEvents from 'app/build-events';

describe('BuildEvents', function () {
  before(function () {
    this.slow(5000);
  });

  beforeEach(function () {
  });

  it('Should find service using progress_id', function (done) {
    const progressId = '5731bf4b04709406007fefca';

    BuildEvents
      .findServiceByProgressId(progressId)
      .doOnNext(service => {
        expect(service._id).to.exist;
        done();
      })
      .subscribe();
  });
});
