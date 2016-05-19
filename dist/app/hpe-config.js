'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpeConfig = undefined;

var _factorConfig = require('12factor-config');

var _factorConfig2 = _interopRequireDefault(_factorConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HpeConfig = exports.HpeConfig = (0, _factorConfig2.default)({
  mongodbUrl: {
    env: 'CF_HPE_MONGODB_URL',
    type: 'string',
    required: true
  },

  firebaseBuildLogsUrl: {
    env: 'CF_HPE_FIREBASE_BUILD_LOGS_URL',
    type: 'string',
    required: true
  },

  firebaseSecret: {
    env: 'CF_HPE_FIREBASE_SECRET',
    type: 'string',
    required: true
  },

  buildTimeout: {
    env: 'CF_HPE_BUILD_TIMEOUT',
    type: 'integer',
    default: 600
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC9ocGUtY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7O0FBRU8sSUFBTSxnQ0FBWSw0QkFBTztBQUM5QixjQUFZO0FBQ1YsU0FBSyxvQkFESztBQUVWLFVBQU0sUUFGSTtBQUdWLGNBQVU7QUFIQSxHQURrQjs7QUFPOUIsd0JBQXNCO0FBQ3BCLFNBQUssZ0NBRGU7QUFFcEIsVUFBTSxRQUZjO0FBR3BCLGNBQVU7QUFIVSxHQVBROztBQWE5QixrQkFBZ0I7QUFDZCxTQUFLLHdCQURTO0FBRWQsVUFBTSxRQUZRO0FBR2QsY0FBVTtBQUhJLEdBYmM7O0FBbUI5QixnQkFBYztBQUNaLFNBQUssc0JBRE87QUFFWixVQUFNLFNBRk07QUFHWixhQUFTO0FBSEc7QUFuQmdCLENBQVAsQ0FBbEIiLCJmaWxlIjoiYXBwL2hwZS1jb25maWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29uZmlnIGZyb20gJzEyZmFjdG9yLWNvbmZpZyc7XG5cbmV4cG9ydCBjb25zdCBIcGVDb25maWcgPSBjb25maWcoe1xuICBtb25nb2RiVXJsOiB7XG4gICAgZW52OiAnQ0ZfSFBFX01PTkdPREJfVVJMJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICByZXF1aXJlZDogdHJ1ZSxcbiAgfSxcblxuICBmaXJlYmFzZUJ1aWxkTG9nc1VybDoge1xuICAgIGVudjogJ0NGX0hQRV9GSVJFQkFTRV9CVUlMRF9MT0dTX1VSTCcsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgcmVxdWlyZWQ6IHRydWUsXG4gIH0sXG5cbiAgZmlyZWJhc2VTZWNyZXQ6IHtcbiAgICBlbnY6ICdDRl9IUEVfRklSRUJBU0VfU0VDUkVUJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICByZXF1aXJlZDogdHJ1ZSxcbiAgfSxcblxuICBidWlsZFRpbWVvdXQ6IHtcbiAgICBlbnY6ICdDRl9IUEVfQlVJTERfVElNRU9VVCcsXG4gICAgdHlwZTogJ2ludGVnZXInLFxuICAgIGRlZmF1bHQ6IDYwMCxcbiAgfSxcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
