/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import './config.env';
import _ from 'lodash';
import util from 'util';
import uuid from 'uuid';
import Firebase from 'firebase';
import { expect } from 'chai';
import { HpeService } from 'cf-hpe';
import FirebaseTokenGenerator from 'firebase-token-generator';

process.env.TEST_ROOT_URL = util.format(
  'https://heylo-dev.firebaseio.com/firebase-rx-test/%s',
  uuid.v4());

process.env.TEST_AUTH_UID = 'firebase-rx-test-uid';
process.env.TEST_AUTH_SECRET = 'FlpWqHBy4VkG5Wjmz7npsH4tRCbrb0tGEwUWXrhe';

describe('HpeService', function () {
  this.slow(5000);
  this.timeout(15000);

  const testSuitState = {
    session: undefined,
    serverId: undefined,
    serverInstanceId: undefined,
    pipelineId: undefined,
    rootJobBuildId: undefined,
    rootJobStartTime: undefined,
  };

  beforeEach(function () {
    this.testRef = new Firebase(process.env.TEST_ROOT_URL);
    this.testRef.remove();
    this.tokenGenerator = new FirebaseTokenGenerator(process.env.TEST_AUTH_SECRET);
    this.token = this.tokenGenerator.createToken({ uid: process.env.TEST_AUTH_UID });
  });

  it.skip('Should open a session', function (done) {
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
