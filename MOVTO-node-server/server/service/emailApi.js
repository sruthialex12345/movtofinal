import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import path from 'path';
import ServerConfig from '../models/serverConfig';
import UserSchema from '../models/user';
import ContactSchema from '../models/contact';
import RequestDemoSchema from '../models/requestDemo';
import ReservationCodeSchema from '../models/reservationCode';
import JoinOurPartnerSchema from '../models/joinOurPartner';

const { EmailTemplate } = require('email-templates');

const registerDir = path.resolve(__dirname, '../templates', 'register');
const register = new EmailTemplate(path.join(registerDir));

const endtripDir = path.resolve(__dirname, '../templates', 'endTrip');
const endTrip = new EmailTemplate(path.join(endtripDir));

const forgotDir = path.resolve(__dirname, '../templates', 'forgotPassword');
const forgot = new EmailTemplate(path.join(forgotDir));

const rideAcceptDir = path.resolve(__dirname, '../templates', 'rideAccept');
const rideAccept = new EmailTemplate(path.join(rideAcceptDir));

const emailDir = path.resolve(__dirname, '../templates', 'emailVerify');
const emailVerify = new EmailTemplate(path.join(emailDir));

const weeklyStatsDir = path.resolve(__dirname, '../templates', 'weeklyStats');
const weeklyStats = new EmailTemplate(path.join(weeklyStatsDir));

const createDriveDir = path.resolve(__dirname, '../templates', 'createDriver');
const createDriveObj = new EmailTemplate(path.join(createDriveDir));

const createAdminDir = path.resolve(__dirname, '../templates', 'createAdmin');
const createAdminObj = new EmailTemplate(path.join(createAdminDir));

const sendEmailToManagerDir = path.resolve(__dirname, '../templates', 'sendEmailToManager');
const sendEmailToManagerObj = new EmailTemplate(path.join(sendEmailToManagerDir));

const createContactusDir = path.resolve(__dirname, '../templates', 'contactus');
const createContactusObj = new EmailTemplate(path.join(createContactusDir));

const requestDemoDir = path.resolve(__dirname, '../templates', 'requestDemo');
const requestDemoObj = new EmailTemplate(path.join(requestDemoDir));

const createJoinOurPartnerDir = path.resolve(__dirname, '../templates', 'joinOurPartner');
const createJoinOurPartnerObj = new EmailTemplate(path.join(createJoinOurPartnerDir));

const ReservationCodeDir = path.resolve(__dirname, '../templates', 'reservationCode');
const ReservationCodeObj = new EmailTemplate(path.join(ReservationCodeDir));

function getEmailApiDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: 'emailConfig' })
      .then((foundDetails) => {
        resolve(foundDetails.value);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function sendEmail(userId, responseObj, type) {
  let Schema=UserSchema;
  if(type=='contactus'){
    Schema = ContactSchema
  }
  if(type=='requestDemo'){
    Schema = RequestDemoSchema
  }
  if(type=='reservationCode'){
    Schema = ReservationCodeSchema
  }
  if(type=='joinOurPartner'){
    Schema = JoinOurPartnerSchema
  }
  Schema.findOneAsync({ _id: userId }).then((userObj) => {
    getEmailApiDetails().then((details) => {
      const transporter = nodemailer.createTransport(smtpTransport({
        host: details.host,
        port: details.port,
        secure: details.secure, // secure:true for port 465, secure:false for port 587
        auth: {
          user: details.username,
          pass: details.password,
        },
      }));
      responseObj.fname = userObj.fname;

      const locals = Object.assign({}, { data: responseObj });

      if (type === 'emailVerify') {
        // eslint-disable-next-line
        emailVerify.render(locals, (err, results) => {
          if (err) {
            return console.error(err); //eslint-disable-line
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Verify your Account with Strap TaxiApp', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'register') {
        // eslint-disable-next-line
        register.render(locals, (err, results) => {
          if (err) {
            return console.error(err); //eslint-disable-line
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account with Strap TaxiApp is created', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'endTrip') {
        endTrip.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Ride Details with Strap TaxiApp', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'forgot') {
        forgot.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account Password with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'rideAccept') {
        rideAccept.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Strap TaxiApp Driver Details', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'weeklyStatsDriver') {
        weeklyStats.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Strap TaxiApp Driver Weekly Stats', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'createDriver') {
        createDriveObj.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account Password and Access code with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'createAdmin') {
        createAdminObj.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.email, // list of receivers
            subject: 'Your Account Password with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            console.log('result in emailApi', info);
            return info;
          });
        });
      }
      if (type === 'sendEmailToManager') {
        sendEmailToManagerObj.render(locals, (err, results) => {
          if (err) {
            return console.error(err);
          }
          const mailOptions = {
            from: details.username, // sender address
            to: userObj.managerDetails[0].email, // list of receivers
            subject: 'Your Account Password with CIDR', // Subject line
            text: results.text, // plain text body
            html: results.html, // html body
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error in emailApi', error);
              return error;
            }
            return info;
          });
        });
      }
      if (type === 'contactus') {
        UserSchema.findOneAsync({ userType: 'superAdmin'}, 'name email').then((adminObj) => {
          createContactusObj.render(locals, (err, results) => {
            if (err) {
              return console.error(err);
            }
            const mailOptions = {
              from: userObj.email, // sender address
              to: adminObj.email, // list of receivers
              subject: 'New Query message', // Subject line
              replyTo : userObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html, // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        })
      }
      if (type === 'requestDemo') {
        UserSchema.findOneAsync({ userType: 'superAdmin'}, 'name email').then((adminObj) => {
          requestDemoObj.render(locals, (err, results) => {
            if (err) {
              return console.error(err);
            }
            const mailOptions = {
              from: userObj.email, // sender address
              to: "sales@circulardrive.com", // list of receivers
              subject: 'Request Demo Message', // Subject line
              replyTo : userObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html, // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        })
      }
      if (type === 'joinOurPartner') {
        UserSchema.findOneAsync({ userType: 'superAdmin'}, 'name email').then((adminObj) => {
          createJoinOurPartnerObj.render(locals, (err, results) => {
            if (err) {
              return console.error(err);
            }
            const mailOptions = {
              from: userObj.email, // sender address
              to: adminObj.email, // list of receivers
              subject: 'New Query message', // Subject line
              replyTo : userObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html, // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        })
      }
      if (type === 'reservationCode') {
        UserSchema.findOneAsync({ _id: userObj.userIdAdmin}, 'name email').then((adminObj) => {
          ReservationCodeObj.render(locals, (err, results) => {
            if (err) {
              return console.error(err);
            }
            const mailOptions = {
              from: adminObj.email, // sender address
              to: userObj.email, // list of receivers
              subject: 'Reservation Code', // Subject line
              replyTo : adminObj.email, //This is what I tried
              text: results.text, // plain text body
              html: results.html, // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('error in emailApi', error);
                return error;
              }
              console.log('result in emailApi', info);
              return info;
            });
          });
        });
      }
    });
  });
}

export default sendEmail;
