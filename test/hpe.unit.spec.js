'use strict';
import Hpe from '../index';

describe('Authenticate with HPE', function () {
  it('Should return success for ', function (done) {
    Hpe.authenticate().subscribe();
  });
});
