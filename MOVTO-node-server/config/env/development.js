export default {
  env: 'development',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  // db: 'mongodb://ridesharingapp:ridesharingapp@localhost/ridesharingapp',
  //db: 'mongodb://localhost/shuttle-dev-db-v1',
  db: 'mongodb://localhost:27017/cidrprod',
  dbConnectOptions: {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
  },
  fcm: {
    serverKey: "AAAAeAUmisg:APA91bGPrxcVeOQ2UGTh_mdkV2QJOpHGaQxlcAc1cEzjB103dtHA4pSGQYW13JxSETxujpb_VXC46jph1wO95xgz02B0ZB_BPd-BD_r29KfDY6VTrfZXT4YibhZd04hZApjXOWDD4MUp"
  },
  // port: 3041,
  port: 3010,
  passportOptions: {
    session: false,
  },
  dynamicRouteOptions: {
    nearOtherShuttleRadius: 3.106856/3963.2 // set to 5 km
  },
  riderProvidersWithinRadius: 50/3963.2,  //set radius around the rider current loc to show admin with the area
  radius: 10 / 6378, // where 10 Kms is used as radius to find nearby driver
  // The query converts the distance to radians by dividing by the approximate equatorial radius of the earth, 3963.2 miles
  nearbyTerminalRadius: 0.0621371/3963.2, // 0.0621371 miles = 100 meters
  arrivedDistance: 200,
  arrivingDistance: 1000,
  limit: 10,
  skip: 0,
  tripFilter: 'All',
};
