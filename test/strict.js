/* eslint-env mocha */
import { expect } from 'chai';

describe('This code', () => {
  it('is expected to run in strict mode', () => {
    const isStrict = (function() { return !this; })();
    expect(isStrict).to.equal(true);
  });
});
