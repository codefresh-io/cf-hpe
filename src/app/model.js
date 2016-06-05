import url from 'url';
import mongoose, { Schema } from 'mongoose';
import { HpeConfig } from 'app/hpe-config';
import { Logger } from 'lib/logger';

const logger = Logger.create('Model');

logger.info('Connecting mongodb.');
mongoose.connect(HpeConfig.CF_HPE_MONGODB_URL);


const toObjectId = mongoose.Types.ObjectId;
const Account = mongoose.model('account', new Schema());
const Service = mongoose.model('service', new Schema());
const Build = mongoose.model('build', new Schema());

export const Model = {
  toObjectId,
  Account,
  Service,
  Build,
};
