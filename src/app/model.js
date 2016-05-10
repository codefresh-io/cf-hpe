import mongoose, { Schema } from 'mongoose';

const objectId = mongoose.Types.ObjectId;
const Account = mongoose.model('account', new Schema());
const Service = mongoose.model('service', new Schema());
const Build = mongoose.model('build', new Schema());

export {
  objectId,
  Account,
  Service,
  Build,
};
