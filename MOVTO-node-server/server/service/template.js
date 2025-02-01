import path from 'path';
import UserSchema from '../models/user';
import { json } from 'express';

const { EmailTemplate } = require('email-templates');

const ReservationCodeDir = path.resolve(__dirname, '../templates', 'customTemplate');
const ReservationCodeObj = new EmailTemplate(path.join(ReservationCodeDir));

export function getCustomEmailTemplate(userId) {
  return new Promise((resolve, reject) => {
    UserSchema.findOneAsync({ _id: userId}).then(adminObj => {
        const locals = Object.assign({}, { data: adminObj });
        ReservationCodeObj.render(locals, (err, results) => {
            if (err) {
                return reject(err);
            }
            return resolve(results.html)
        });
    }).catch(err=>{
        return reject(err);
    })

  });
}