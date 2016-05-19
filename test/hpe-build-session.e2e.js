/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import { expect } from 'chai';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { HpeBuildSession } from 'app/hpe-build-session';

describe('BuildHpe', function () {
  this.slow(2000);
  this.timeout(30000);

  it('Should open build session', function (done) {
    Build.builds().take(1)
      .flatMap(build => {
        return HpeBuildSession
          .openSession(build)
          .doOnNext(hpeBuildSession => {
            expect(hpeBuildSession).to.not.be.null;
            done();
          });
      })
      .doOnError(error => done(error))
      .subscribe();
  });

  it.only('Should report build steps status', function (done) {
    Build.builds()
      .take(10)
      .flatMap(build => HpeBuildSession.openSession(build).flatMap(buildSession => {
        return BuildStep.steps(build).flatMap(step => {
          return HpeBuildSession.reportStepStatus(buildSession, step);
        });
      }))
      .doOnNext(stepStatus => {

      })
      .doOnError(error => {
        done(error);
      })
      .subscribe();
  });
});
