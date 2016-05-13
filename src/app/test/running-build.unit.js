/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import { expect } from 'chai';
import RunningBuild from 'app/running-build';
import RunningBuildStep from 'app/running-build-step';

describe('RunningBuild', function () {
  this.slow(2000);
  this.timeout(30000);

  it('Should receive running build events', function (done) {
    RunningBuild
      .getRunningBuilds()
      .take(1)
      .doOnNext(buildLogRef => {
        done();
      })
      .doOnError(error => done(error))
      .subscribe();
  });

  it('Should receive runnung build step events', function (done) {
    RunningBuild
      .getRunningBuilds()
      .take(1)
      .doOnNext(buildLogRef => {
        RunningBuildStep.
          getRunningBuildSteps(buildLogRef)
          .doOnError(error => done(error))
          .doOnNext(buildStep => {
            done();
          })
          .subscribe();
      })
      .doOnError(error => done(error))
      .subscribe();
  });
});
