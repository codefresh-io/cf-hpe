import _ from 'lodash';
import Rx from 'rx';
import { HpeApi } from 'lib/hpe-api';
import config from './config';

class HpeService {
  constructor() {

  }
  
  createCiServer() {
    const serverName = Util.format('Codefresh %d', _.now());
    const serverInstanceId = _.kebabCase(serverName);
  }
}

export default HpeService;
