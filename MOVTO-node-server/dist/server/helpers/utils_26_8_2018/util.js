'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var shortid = require('shortid');
var circleToPolygon = require('circle-to-polygon');
var convert = require('convert-units');

var Utilities = function () {
  function Utilities() {
    (0, _classCallCheck3.default)(this, Utilities);
  }

  (0, _createClass3.default)(Utilities, null, [{
    key: 'generateVerificationCode',

    /**
     * @param  {} void
     * @returns  {} 4 digit otp verification code
     */
    value: function generateVerificationCode() {
      return Math.floor(1000 + Math.random() * 9000);
    }

    /**
     * @param  {} req
     * @returns base url of the server
     */

  }, {
    key: 'getBaseUrl',
    value: function getBaseUrl(req) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      return fullUrl;
    }

    /**
     * @param  {} req
     * @returns uploaded images base url
     */

  }, {
    key: 'getUploadsAvtarsUrl',
    value: function getUploadsAvtarsUrl(req) {
      var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/avtars';
      return fullUrl;
    }
  }, {
    key: 'getUploadsShuttlesUrl',
    value: function getUploadsShuttlesUrl(req) {
      var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/shuttles';
      return fullUrl;
    }
  }, {
    key: 'generateAccessCode',
    value: function generateAccessCode() {
      return shortid.generate();
    }
  }, {
    key: 'getUnixTimeStamp',
    value: function getUnixTimeStamp(dateObj) {
      return Math.round(dateObj.getTime() / 1000);
    }
  }, {
    key: 'getCirclePolygons',
    value: function getCirclePolygons(data) {
      var polygon = circleToPolygon(data.coordinates, convert(data.radius).from('mi').to('m'), data.numberOfEdges || 32);
      return polygon;
    }
    // static generateUniueReservationCode () {
    //   var token = "";
    //   var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    //   for (var i = 0; i < 4; i++)
    //   token += charset.charAt(Math.floor(Math.random() * charset.length));
    //   return token;
    // }

  }, {
    key: 'generateUniueReservationCode',
    value: function generateUniueReservationCode() {
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      var string_length = 4;
      var randomstring = '';
      for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
      }
      return randomstring;
    }
  }, {
    key: 'hmsToms',
    value: function hmsToms(dateToConvert) {
      console.log("dateToConvert", dateToConvert);
      var dateObj = new Date(dateToConvert);
      var hrs = dateObj.getHours();
      var min = dateObj.getMinutes();
      // let sec = dateObj.getSeconds();
      // let miliSec = dateObj.getMilliseconds();
      // console.log("hrs min sec miliSec",hrs, min, miliSec)
      return (hrs * 60 * 60 + min * 60) * 1000;
    }
  }]);
  return Utilities;
}();

module.exports = Utilities;
//# sourceMappingURL=util.js.map
