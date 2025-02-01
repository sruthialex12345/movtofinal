import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import faqObj from '../models/faq';

var faq = function (req, res) {
    const { pageNo, limit = config.limit } = req.query;
    const name  = req.query.keyword?req.query.keyword:'';
    let query = {
      is_deleted: false,
      $or:[
        {"question":{$regex:name,$options:'i'}},
        {"answer":{$regex:name,$options:'i'}}
      ]
    }
    faqObj.countAsync(query)
      .then(totalUserRecord => {
          console.log("totalUserRecord", totalUserRecord)
        const returnObj = {
          success: true,
          message: `no of Faq's are zero`, // `no of active drivers are ${returnObj.data.length}`;
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
        faqObj.find(query)
          .then((userData) => {
            returnObj.data = userData;
            returnObj.message = `Faq's pages found`;
            returnObj.meta.currNoOfRecord = returnObj.data.length;
            return res.send(returnObj);
          })
          .catch((err) => {
            res.send('Error', err);
          });
      })
      .error((e) => {
        const err = new APIError(`error occured while counting the no of users ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        debug('error inside Faqs records');
        next(err);
      });
}

function faqDetails(req, res, next) {
    faqObj.findOneAsync({ _id: req.query.faqId })
    .then((faqDoc) => {
      const returnObj = {
        success: false,
        message: 'Unable to find the Page',
        data: null,
        meta: null,
      };
      if (faqDoc) {
        returnObj.success = true;
        returnObj.message = 'Success';
        returnObj.data = faqDoc;
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

  function createFaq(req, res, next) {
    const faqData = Object.assign({}, req.body);
    faqObj.findOneAsync({
      $or: [
        {question: req.body.question}
      ]
    })
      // eslint-disable-next-line consistent-return
      .then((foundUser) => {
        const returnObj = {
          success: false,
          message: '',
          data: null,
        };
        if (foundUser !== null) {
          const err = new APIError('This questions is already exists', httpStatus.CONFLICT, true);
          return next(err);
        }
            const faqsObj = new faqObj({
                question: faqData.question,
                answer: faqData.answer
            });
            faqsObj
              .saveAsync()
              .then((savedUser) => {
                returnObj.success = true;
                returnObj.message = 'Faq created successfully';
                returnObj.data = savedUser;
                res.send(returnObj);
              })
              .error((e) => {
                const err = new APIError(`Error while Creating new Faq ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
                returnObj.success = false;
                returnObj.message = 'Faq not created';
                console.log(err); // eslint-disable-line no-console
                return next(returnObj);
              });
      })
      .error((e) => {
        const err = new APIError(`Error while Searching the Faq ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        return next(err);
      });
  }


  function updateFaq(req, res, next) {
    const updatePageObj = Object.assign({}, req.body);
    faqObj.findOneAsync({ _id: req.body.faqId })
      .then((pageDoc) => {
        const returnObj = {
          success: false,
          message: 'unable to find the object',
          data: null,
          meta: null,
        };
        if (pageDoc) {
            pageDoc.question = updatePageObj.question;
            pageDoc.answer = updatePageObj.answer;
            pageDoc
            .saveAsync()
            .then((savedDoc) => {
              returnObj.success = true;
                returnObj.message = 'Faqs page updated';
                returnObj.data = savedDoc;
                res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error occured while updating the Faqs details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
        } else {
          res.send(returnObj);
        }
      })
      .error((e) => {
        const err = new APIError(`Error occured while searching for the Faqs ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
  }

  function updateFaqStatus(req, res, next) {
    faqObj.updateAsync({ _id:  req.body._id }, { $set: { status:req.body.status }}) // eslint-disable-line no-underscore-dangle
    .then((savedDoc) => {
      const returnObj = {
      success:true,
      message:'Faq document updated',
      data:savedDoc,
      };
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating Faq Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }

  function faqRemove(req, res, next) {
    faqObj.updateAsync({ _id:  req.body._id }, { $set: { is_deleted:req.body.status }}) // eslint-disable-line no-underscore-dangle
    .then((savedDoc) => {
      const returnObj = {
      success:true,
      message:'Faq document deleted',
      data:savedDoc,
      };
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating Faq Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }

  export default {
    faq,faqDetails,createFaq,updateFaq,updateFaqStatus,faqRemove
}
