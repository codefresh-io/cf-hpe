'use strict';
import Xml2js from 'xml2js';
import Chai from 'chai';

const expect = Chai.expect;

describe('Xml', () => {
  const obj = { name: 'Super', Surname: 'Man', age: 23 };

  const builder = new Xml2js.Builder();
  const xml = builder.buildObject(obj);
  console.info(xml);
});
