import passportJWT from 'passport-jwt';
import cfg from './env';
import UserSchema from '../server/models/user';

const { ExtractJwt } = passportJWT;
const jwtStrategy = passportJWT.Strategy;

function passportConfiguration(passport) {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  // opts.tokenQueryParameterName = ExtractJwt.fromUrlQueryParameter(auth_token);
  opts.secretOrKey = cfg.jwtSecret;
  passport.use(new jwtStrategy(opts, (jwtPayload, cb) => {
      UserSchema.findOneAsync({ _id: jwtPayload._id,jwtAccessToken:jwtPayload.numberunique }) //eslint-disable-line
      .then(user => cb(null, user))
      .error(err => cb(err, false));
  }));
}

export default passportConfiguration;
