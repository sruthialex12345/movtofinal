"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function transformReturnObj(Data) {
  if (Data instanceof Object) {
    Data = Data.toObject();
    if (Data.riderId) {
      Data.rider = Data.riderId;
      // eslint-disable-next-line
      Data.riderId = Data.rider._id ? Data.rider._id : null;
    }
    if (Data.driverId) {
      Data.driver = Data.driverId;
      // eslint-disable-next-line
      Data.driverId = Data.driver._id ? Data.driver._id : null;
    }
  }
  return Data;
}

exports.default = { transformReturnObj: transformReturnObj };
module.exports = exports.default;
//# sourceMappingURL=transform-return-object.js.map
