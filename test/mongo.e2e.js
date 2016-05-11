/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import './config.env';
import { expect } from 'chai';
import mongoose, { Schema } from 'mongoose';

describe('HpeService', function () {

  before(function () {
    mongoose.connect('mongodb://admin:codefreshstaging@ds049424-a0.mongolab.com:49424/google_staging?readPreference=primaryPreferred');

  });

  beforeEach(function () {
  });

  it('Should find service_id using progress_id', function (done) {
    const Build = mongoose.model('build', new Schema());
    Build
      .findOne({ progress_id: mongoose.Types.ObjectId('5731bf4b04709406007fefca') })
      .then(
        (build) => {
          done();
        },
        (error) => {
          done(error);
        });
  });
});
