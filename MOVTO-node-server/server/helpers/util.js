const shortid = require('shortid');
const circleToPolygon = require('circle-to-polygon');
var convert = require('convert-units')

class Utilities {
  /**
   * @param  {} void
   * @returns  {} 4 digit otp verification code
   */
  static generateVerificationCode () {
    return Math.floor(1000 + Math.random() * 9000)
  }

  /**
   * @param  {} req
   * @returns base url of the server
   */
  static getBaseUrl (req) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    return fullUrl;
  }

  /**
   * @param  {} req
   * @returns uploaded images base url
   */
  static getUploadsAvtarsUrl (req) {
    var fullUrl = `${req.protocol}://${req.get('host')}/uploads/avtars`;
    return fullUrl;
  }

  static getUploadsShuttlesUrl (req) {
    var fullUrl = `${req.protocol}://${req.get('host')}/uploads/shuttles`;
    return fullUrl;
  }

  static generateAccessCode() {
    //return shortid.generate();
	//CLL-Adhithya for 4 digit numerical code fix
    var chars = "0123456789";
    var string_length = 4;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
  }

  static getUnixTimeStamp(dateObj) {
    return Math.round(dateObj.getTime()/1000)
  }

  static getCirclePolygons(data) {
    let polygon = circleToPolygon(data.coordinates, convert(data.radius).from('mi').to('m'), data.numberOfEdges || 32);
    return polygon;
  }
  // static generateUniueReservationCode () {
  //   var token = "";
  //   var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  //   for (var i = 0; i < 4; i++)
  //   token += charset.charAt(Math.floor(Math.random() * charset.length));
  //   return token;
  // }
  static generateUniueReservationCode () {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var string_length = 4;
    var randomstring = '';
    for (var i=0; i<string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
  }

  static hmsToms(dateToConvert) {
    console.log("dateToConvert", dateToConvert);
    let dateObj = new Date(dateToConvert);
    let hrs = dateObj.getHours();
    let min = dateObj.getMinutes();
    // let sec = dateObj.getSeconds();
    // let miliSec = dateObj.getMilliseconds();
    // console.log("hrs min sec miliSec",hrs, min, miliSec)
    return(((hrs*60*60+min*60)*1000));
  }
}

module.exports = Utilities;
