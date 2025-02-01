import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import staticPages from '../models/staticPage';
import contacts from '../models/contact';
import requestDemoSchema from '../models/requestDemo';
import sendEmail from '../service/emailApi';
import joinOurPartnerObj from '../models/joinOurPartner';
import BlogShecma from '../models/blog'

var list = function (req, res) {
    const { pageNo, limit = config.limit } = req.query;
    const name  = req.query.keyword?req.query.keyword:'';
    let query = {
      is_deleted: false,
      $or:[
        {"heading":{$regex:name,$options:'i'}}
      ]
    }
      staticPages.countAsync(query)
      .then(totalUserRecord => {
          console.log("totalUserRecord -- >",totalUserRecord);
        const returnObj = {
          success: true,
          message: `no of Static pages are zero`, // `no of active drivers are ${returnObj.data.length}`;
          data: null,
          meta: {
            totalNoOfPages: Math.ceil(totalUserRecord / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 20,
          },
        };
        if (totalUserRecord < 1) {
          return res.send(returnObj);
        }
        staticPages.find(query)
          .then((userData) => {
            returnObj.data = userData;
            returnObj.message = `Static pages found`;
            returnObj.meta.currNoOfRecord = returnObj.data.length;
            return res.send(returnObj);
          })
          .catch((err) => {
            res.send('Error', err);
          });
      })
      .error((e) => {
        const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        debug('error inside getAllUsers records');
        next(err);
      });

}

function staticPageDetails(req, res, next) {
  console.log(req.query);
  console.log(req.query.pageSlug);
    staticPages.findOneAsync({ slug: req.query.pageSlug })
    .then((StaticDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the Page',
        data: "Not Found",
        meta: null,
      };
      if (StaticDoc) {
        returnObj.success = true;
        returnObj.message = 'Success';
        returnObj.data = StaticDoc;
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }


  function updateStaticPage(req, res, next) {
    const updatePageObj = Object.assign({}, req.body);
    // console.log("Request-->",  req.body);
    staticPages.findOneAsync({ slug: req.body.slug })
      .then((pageDoc) => {
        const returnObj = {
          success: false,
          message: 'unable to find the object',
          data: null,
          meta: null,
        };
        if (pageDoc) {
            pageDoc.heading = updatePageObj.heading;
            pageDoc.content = updatePageObj.content;
            pageDoc.title = updatePageObj.title;
            pageDoc.description = updatePageObj.description;
            pageDoc.keywords = updatePageObj.keywords;
            pageDoc.author = updatePageObj.author;
            pageDoc
            .saveAsync()
            .then((savedDoc) => {
              returnObj.success = true;
                returnObj.message = 'Static page updated';
                returnObj.data = savedDoc;
                res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error occured while updating the user details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        } else {
          res.send(returnObj);
        }
      })
      .error((e) => {
        const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
  }

  var contactList = function (req, res) {
    const { pageNo, limit = config.limit } = req.query;
    const name  = req.query.keyword?req.query.keyword:'';
    let query = {
      is_deleted: false,
      $or:[
        {"name":{$regex:name,$options:'i'}},
        {"subject":{$regex:name,$options:'i'}},
        {"email":{$regex:name,$options:'i'}}
      ]
    }
    contacts.countAsync(query)
      .then(totalUserRecord => {
          console.log("totalUserRecord -- >",totalUserRecord);
        const returnObj = {
          success: true,
          message: `no of Contactus list are zero`, // `no of active drivers are ${returnObj.data.length}`;
          data: null,
          meta: {
            totalNoOfPages: Math.ceil(totalUserRecord / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 20,
          },
        };
        if (totalUserRecord < 1) {
          return res.send(returnObj);
        }
        contacts.find(query)
          .then((userData) => {
            returnObj.data = userData;
            returnObj.message = `Contactus list found`;
            returnObj.meta.currNoOfRecord = returnObj.data.length;
            return res.send(returnObj);
          })
          .catch((err) => {
            res.send('Error', err);
          });
      })
      .error((e) => {
        const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        debug('error inside Contactus list records');
        next(err);
      });

}

// { email: req.body.email, phoneNo: req.body.phoneNo }
function contactus(req, res, next) {
    const userData = Object.assign({}, req.body);
    const returnObj = {
          success: false,
          message: '',
          data: null,
        };
        if(userData.email == '' || userData.name == '' ||userData.slug == '' || userData.subject == '' ){
            const err = new APIError('Please fill all required fields', httpStatus.CONFLICT, true);
            return next(err);
        }
    const contactsObj = new contacts({
        email: userData.email,
        name: userData.name,
        message: userData.message,
        subject: userData.subject,
        isdCode: userData.isdCode,
        phoneNo: userData.phoneNo
    });
    contactsObj
        .saveAsync()
        .then((savedUser) => {
        returnObj.success = true;
        returnObj.message = 'Request Submitted, CircularDrive team will contact you.';
        returnObj.data = savedUser;
        sendEmail(savedUser._id, savedUser, 'contactus'); //eslint-disable-line
        res.send(returnObj);
        })
        .error((e) => {
        console.log(e); // eslint-disable-line no-console
        const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'Message not sent';
        return next(returnObj);
        });
  }

  function joinOurPartner(req, res, next) {
    const userData = Object.assign({}, req.body);
    const returnObj = {
          success: false,
          message: '',
          data: null,
        };
        if(userData.email == '' || userData.name == '' || userData.phoneNo == '' || userData.subject == '' ){
            const err = new APIError('Please fill all required fields', httpStatus.CONFLICT, true);
            return next(err);
        }
    const joinOurPartnersObj = new joinOurPartnerObj({
      name: userData.name,
      company_name: userData.company_name,
      phoneNo:userData.phoneNo,
      email:userData.email.toLowerCase(),
      isdCode: userData.isdCode,
      message: userData.message,
      noofdriver: userData.noofdriver,
      address: userData.address,
      noofshuttle: userData.noofshuttle
    });
    joinOurPartnersObj
        .saveAsync()
        .then((savedUser) => {
        returnObj.success = true;
        returnObj.message = 'Request Submitted, CircularDrive team will contact you';
        returnObj.data = savedUser;
        sendEmail(savedUser._id, savedUser, 'joinOurPartner'); //eslint-disable-line
        res.send(returnObj);
        })
        .error((e) => {
        console.log(e); // eslint-disable-line no-console
        const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'Message not sent';
        return next(returnObj);
        });
  }

  var joinPartnerList = function (req, res) {
    const { pageNo, limit = config.limit } = req.query;
    const name  = req.query.keyword?req.query.keyword:'';
    let query = {
      is_deleted: false,
      $or:[
        {"name":{$regex:name,$options:'i'}},
        {"address":{$regex:name,$options:'i'}},
        {"email":{$regex:name,$options:'i'}},
        {"company_name":{$regex:name,$options:'i'}}
      ]
    }
    joinOurPartnerObj.countAsync(query)
      .then(totalUserRecord => {
        const returnObj = {
          success: true,
          message: `no of join partner list are zero`, // `no of active drivers are ${returnObj.data.length}`;
          data: null,
          meta: {
            totalNoOfPages: Math.ceil(totalUserRecord / limit),
            limit,
            currPageNo: pageNo,
            currNoOfRecord: 20,
          },
        };
        if (totalUserRecord < 1) {
          return res.send(returnObj);
        }
        joinOurPartnerObj.find(query)
          .then((userData) => {
            returnObj.data = userData;
            returnObj.message = `Join partner list found`;
            returnObj.meta.currNoOfRecord = returnObj.data.length;
            return res.send(returnObj);
          })
          .catch((err) => {
            res.send('Error', err);
          });
      })
      .error((e) => {
        const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        debug('error inside Contactus list records');
        next(err);
      });

}



var blogs = function (req, res) {
  const { pageNo, limit = config.limit } = req.query;
  const name  = req.query.keyword?req.query.keyword:'';
  let query = {
    is_deleted: false,
    $or:[
      {"heading":{$regex:name,$options:'i'}}
    ]
  }
  BlogShecma.countAsync(query)
    .then(totalBlogRecord => {
      const returnObj = {
        success: true,
        message: `no of Blog's are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalBlogRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20,
        },
      };
      if (totalBlogRecord < 1) {
        return res.send(returnObj);
      }
      BlogShecma.find(query)
        .then((userData) => {
          returnObj.data = userData;
          returnObj.message = `Blog's pages found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          return res.send(returnObj);
        })
        .catch((err) => {
          res.send('Error', err);
        });
    })
    .error((e) => {
      const err = new APIError(`error occured while counting the no of Blog ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      debug('error inside Blogs records');
      next(err);
    });
}

function blogDetails(req, res, next) {
  BlogShecma.findOneAsync({ slug: req.query.pageSlug })
    .then((BlogDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the Page',
        data: "Not Found",
        meta: null,
      };
      if (BlogDoc) {
        returnObj.success = true;
        returnObj.message = 'Success';
        returnObj.data = BlogDoc;
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .error((e) => {
      const err = new APIError(`Error occured while searching for the user ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }

  function requestDemo(req, res, next) {
    const userData = Object.assign({}, req.body);
    const returnObj = {
          success: false,
          message: '',
          data: null,
        };
        if(userData.email == '' || userData.name == '' ||userData.slug == '' || userData.subject == '' ){
            const err = new APIError('Please fill all required fields', httpStatus.CONFLICT, true);
            return next(err);
        }
    const requestDemoObj = new requestDemoSchema({
        email: userData.email,
        name: userData.name,
        company: userData.company,
        address: userData.address,
        isdCode: userData.isdCode,
        phoneNo: userData.phoneNo
    });
    requestDemoObj
        .saveAsync()
        .then((savedData) => {
        returnObj.success = true;
        returnObj.message = 'Request Submitted, CircularDrive team will contact you.';
        returnObj.data = savedData;
        sendEmail(savedData._id, savedData, 'requestDemo'); //eslint-disable-line
        res.send(returnObj);
        })
        .error((e) => {
        console.log(e); // eslint-disable-line no-console
        const err = new APIError(`Error while Creating new User ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        returnObj.success = false;
        returnObj.message = 'Message not sent';
        return next(returnObj);
        });
  }

export default {
    list,staticPageDetails,updateStaticPage,
    contactList,contactus,joinOurPartner,joinPartnerList,requestDemo,
    blogs,blogDetails
}
