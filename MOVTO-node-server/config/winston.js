import winston from 'winston';
import path from 'path';

let logFile = path.join(__dirname, '../../logF.log');
console.log("file to log>>>>>>>>>>", logFile);
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true,
    }),
    new winston.transports.File({filename: path.join(logFile)})
  ],
});

export default logger;
