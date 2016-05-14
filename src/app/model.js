import config from './config';
import mongoose, { Schema } from 'mongoose';

mongoose.connect(config.mongodbUrl);
const objectId = mongoose.Types.ObjectId;
const Account = mongoose.model('account', new Schema());
const Service = mongoose.model('service', new Schema());
const Build = mongoose.model('build', new Schema());

export default {
  objectId,
  Account,
  Service,
  Build,
};
