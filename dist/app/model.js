'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Model = undefined;

var _hpeConfig = require('./hpe-config');

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.connect(_hpeConfig.HpeConfig.mongodbUrl);
var toObjectId = _mongoose2.default.Types.ObjectId;
var Account = _mongoose2.default.model('account', new _mongoose.Schema());
var Service = _mongoose2.default.model('service', new _mongoose.Schema());
var Build = _mongoose2.default.model('build', new _mongoose.Schema());

var Model = exports.Model = {
  toObjectId: toObjectId,
  Account: Account,
  Service: Service,
  Build: Build
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC9tb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQTs7Ozs7O0FBRUEsbUJBQVMsT0FBVCxDQUFpQixxQkFBVSxVQUEzQjtBQUNBLElBQU0sYUFBYSxtQkFBUyxLQUFULENBQWUsUUFBbEM7QUFDQSxJQUFNLFVBQVUsbUJBQVMsS0FBVCxDQUFlLFNBQWYsRUFBMEIsc0JBQTFCLENBQWhCO0FBQ0EsSUFBTSxVQUFVLG1CQUFTLEtBQVQsQ0FBZSxTQUFmLEVBQTBCLHNCQUExQixDQUFoQjtBQUNBLElBQU0sUUFBUSxtQkFBUyxLQUFULENBQWUsT0FBZixFQUF3QixzQkFBeEIsQ0FBZDs7QUFFTyxJQUFNLHdCQUFRO0FBQ25CLHdCQURtQjtBQUVuQixrQkFGbUI7QUFHbkIsa0JBSG1CO0FBSW5CO0FBSm1CLENBQWQiLCJmaWxlIjoiYXBwL21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHBlQ29uZmlnIH0gZnJvbSAnYXBwL2hwZS1jb25maWcnO1xuaW1wb3J0IG1vbmdvb3NlLCB7IFNjaGVtYSB9IGZyb20gJ21vbmdvb3NlJztcblxubW9uZ29vc2UuY29ubmVjdChIcGVDb25maWcubW9uZ29kYlVybCk7XG5jb25zdCB0b09iamVjdElkID0gbW9uZ29vc2UuVHlwZXMuT2JqZWN0SWQ7XG5jb25zdCBBY2NvdW50ID0gbW9uZ29vc2UubW9kZWwoJ2FjY291bnQnLCBuZXcgU2NoZW1hKCkpO1xuY29uc3QgU2VydmljZSA9IG1vbmdvb3NlLm1vZGVsKCdzZXJ2aWNlJywgbmV3IFNjaGVtYSgpKTtcbmNvbnN0IEJ1aWxkID0gbW9uZ29vc2UubW9kZWwoJ2J1aWxkJywgbmV3IFNjaGVtYSgpKTtcblxuZXhwb3J0IGNvbnN0IE1vZGVsID0ge1xuICB0b09iamVjdElkLFxuICBBY2NvdW50LFxuICBTZXJ2aWNlLFxuICBCdWlsZCxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
