import Promise from 'bluebird';
import mongoose from 'mongoose';
import config from './config/env';
import app from './config/express';
import socketServer from './config/socket-server';
import winstonInstance from "./config/winston";


// promisify mongoose
Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(config.db, { useMongoClient: true,  keepAlive: 1  }, () => {
  if (config.env === 'test') {
    mongoose.connection.db.dropDatabase();
  }
  if(process.env.DEBUG === '*'){
      mongoose.set("debug", (collectionName, method, query, doc) => {
    	    console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
    	});
  }
});
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.db}`);
});

const debug = require('debug')('MGD-API:index');
// starting socket server
socketServer.startSocketServer(app);

// listen on port config.port
const cidrPort = process.env.PORT || config.port;
app.listen(cidrPort, () => {
  console.log('process env port', cidrPort);
  winstonInstance.info(`Listening on port ${cidrPort}....`)
  debug(`server started on port ${cidrPort}`);
});

export default app;
