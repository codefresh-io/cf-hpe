import { HpeConfig } from 'app/hpe-config';
import mongoose, { Schema } from 'mongoose';

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
