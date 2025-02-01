export default {
  env: 'production',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://localhost:27017/cidrprod',
  dbConnectOptions: {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
  },
  dynamicRouteOptions: {
    nearOtherShuttleRadius: 3.106856/3963.2 // set to 5 km
  },
  fcm: {
    serverKey: "AAAAc6eF5vs:APA91bFC2K5h1FaOqnGuRK_onpJW6qxMQM-EfVv0372vd7dyielx0eYt2tJEvn440HSC0fcXtxzGUxn1eX2EvsE73HVsHhIB-glCnwAK6MGvqZrX10OKM$"
  },
  // port: 3041,
  port: 4202,
  passportOptions: {
    session: false,
  },
  riderProvidersWithinRadius: 50/3963.2, //set radius around the rider current loc to show admin with the area
  radius: 10 / 6378, // where 10 Kms is used as radius to find nearby driver
  // The query converts the distance to radians by dividing by the approximate equatorial radius of the earth, 3963.2 miles
  nearbyTerminalRadius: 0.0621371/3963.2, // 0.0621371 miles = 100 meters
  arrivedDistance: 200,
  arrivingDistance: 1000,
  limit: 10,
  skip: 0,
  tripFilter: 'All',
};

