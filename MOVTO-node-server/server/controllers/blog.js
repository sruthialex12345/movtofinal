import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import BlogSchema from '../models/blog';

var list = function (req, res) {
    const { pageNo, limit = config.limit } = req.query;
    const name  = req.query.keyword?req.query.keyword:'';
    let query = {
      is_deleted: false,
      $or:[
        {"heading":{$regex:name,$options:'i'}}
      ]
    }
      BlogSchema.countAsync(query)
      .then(totalUserRecord => {
          console.log("totalUserRecord -- >",totalUserRecord);
        const returnObj = {
          success: true,
          message: `no of Blog pages are zero`, // `no of active drivers are ${returnObj.data.length}`;
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
        BlogSchema.find(query)
          .then((userData) => {
            returnObj.data = userData;
            returnObj.message = `Blog pages found`;
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
function createBlog(req, res, next) {
  var headingcheck = req.body.heading.replace(new RegExp(" ", 'g'), "-").toLowerCase();
  BlogSchema.findOneAsync({slug:headingcheck})
    // eslint-disable-next-line consistent-return
    .then((foundUser) => {
      const returnObj = {
        success: false,
        message: 'Blog is already exist with this heading, Please try other heading',
        data: null,
      };
      if (foundUser) {
        return res.send(returnObj);
      }
      const blogObj = new BlogSchema({
        heading:req.body.heading,
        content:req.body.content,
        slug:headingcheck,
        title:req.body.title,
        description:req.body.description,
        keywords:req.body.keywords,
        author:req.body.author
      });
      blogObj
        .saveAsync()
        .then((savedUser) => {
          returnObj.success = true;
          returnObj.message = 'Blog created successfully';
          returnObj.data = savedUser;              
          res.send(returnObj);
        })
        .error((e) => {
          const err = new APIError(`Error while Creating new Blog ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = 'Blog not created';
          console.log(err); // eslint-disable-line no-console
          return next(returnObj);
        });
    })
    .error((e) => {
      const err = new APIError(`Error while Searching the Blog ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      return next(err);
    });
}

function blogPageDetails(req, res, next) {
  console.log(req.query);
    BlogSchema.findOneAsync({ _id: req.query._id})
    .then((StaticDoc) => {
      const returnObj = {
        success: false,
        message: 'Blog is details not found',
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


  function updateBlogPage(req, res, next) {
    const updatePageObj = Object.assign({}, req.body);
    var headingcheck = req.body.heading.replace(new RegExp(" ", 'g'), "-").toLowerCase();
    BlogSchema.findOneAsync({ slug: headingcheck,_id:{$ne:req.body.blogId} })
      .then((foundpageDoc) => {
        const returnObj = {
          success: false,
          message: 'Blog is already exist with this heading, Please try other heading',
          data: null,
          meta: null,
        };
        if (foundpageDoc) {
          return res.send(returnObj);
        }
            var pageDoc={       
            heading : updatePageObj.heading,
            content : updatePageObj.content,
            slug : headingcheck,
            title : updatePageObj.title,
            description : updatePageObj.description,
            keywords : updatePageObj.keywords,
            author : updatePageObj.author
           }; 
            BlogSchema.findOneAndUpdate({_id:req.body.blogId},{$set:pageDoc})
            .then((savedDoc) => {
              returnObj.success = true;
                returnObj.message = 'Blog page updated';
                returnObj.data = savedDoc;
                res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(`Error occured while updating the Blog details ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
              next(err);
            });
      })
      .error((e) => {
        const err = new APIError(`Error occured while searching for the Blog ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
        next(err);
      });
  }

  function updateBlogStatus(req, res, next) {
    BlogSchema.updateAsync({ _id:  req.body._id }, { $set: { status:req.body.status }}) // eslint-disable-line no-underscore-dangle
    .then((savedDoc) => {
      const returnObj = {
      success:true,
      message:'Blog updated',
      data:savedDoc,
      };
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating Blog Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }

  function blogRemove(req, res, next) {
    BlogSchema.updateAsync({ _id:  req.body._id }, { $set: { is_deleted:req.body.status }}) // eslint-disable-line no-underscore-dangle
    .then((savedDoc) => {
      const returnObj = {
      success:true,
      message:'Blog deleted',
      data:savedDoc,
      };
      res.send(returnObj);
    })
    .error((e) => {
      const err = new APIError(`Error occured while Updating Blog Object ${e}`, httpStatus.INTERNAL_SERVER_ERROR);
      next(err);
    });
  }

export default {
    list,createBlog,blogPageDetails,updateBlogPage,updateBlogStatus,blogRemove
}
