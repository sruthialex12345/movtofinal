import path from 'path';
//GR - 02/03/2020 - Added for server side debugging
require('dotenv').config();

console.log("env : ", process.env.NODE_ENV);
console.log("DEBUG : ", process.env.DEBUG);
console.log("PORT : ", process.env.PORT);

const env = process.env.NODE_ENV || 'production';
const config = require(`./${env}`); //eslint-disable-line

const defaults = {
  root: path.join(__dirname, '/..'),
};

export default Object.assign(defaults, config);
