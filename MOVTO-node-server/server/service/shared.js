//const curl = new (require( 'curl-request' ))();
const request = require('request');
import _ from 'lodash';
import async from "async";
import mongoose from 'mongoose';
import TripSchema from '../models/trip';
import * as TRIP_REQUEST_STATUS from '../constants/trip-request-statuses';
import * as TRIP_TYPES from '../constants/trip-type';
import * as TERMINAL_TYPES from '../constants/trip-type';
import TripRequestSchema from '../models/tripRequest';
import {GOOGLE_API_KEY} from '../constants/global';
import { json } from 'express';

export function fromTerminalToTerminalTimeAsync(routeTerminals){
  return new Promise((resolve, reject)=>{
    if(!routeTerminals || !Array.isArray(routeTerminals)) {
      return reject(new Error("Invalid Params to calculate time between each terminal"));
    } else {
      let fromTerminalToTerminalTimePromises = routeTerminals.map((terminal, index)=>{
        let src = terminal.address;
        let des = "";
        if(index<routeTerminals.length-1) {
          des = routeTerminals[index+1].address;
        } else {
          des = routeTerminals[0].address;
        }

        return (callback)=>{

          // curl.setHeaders([
          //   'Content-Type:application/json'
          // ])
          // .get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${src}&destinations=${des}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`)
          distanceMatrix(src, des)
          .then(result=>{
            console.log("distanceMatrix result fromTerminalToTerminalTimeAsync>>", JSON.stringify(result));
            return callback(null, JSON.parse(result.body));
          })
          .catch(err=>{
            return callback(err, null);
          })

        }
      })

      async.series(fromTerminalToTerminalTimePromises, (err, results)=>{
        if(err) {
          return reject(err);
        }
        let endTerminalToSrcTime = 0;
        let routeTerminalsTime = routeTerminals.map((terminal, index)=>{
          let result = results[index];
          console.log("                     ");
          console.log("result>>>>>>>>>>>>>>", JSON.stringify(result));
          console.log("                     ");
          if(result.status == "OK") {
            terminal["timeToNextTerminal"] = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
          }
          if(index<routeTerminals.length-1) {
            endTerminalToSrcTime += terminal["timeToNextTerminal"];
          } else {
            terminal["timeToNextTerminal"] = endTerminalToSrcTime;
          }
          return terminal;
        })
        return resolve(routeTerminalsTime);
      })
    }
  })
}

export function staticRouteAsyncETA(tripRequest, trip){
  return new Promise((resolve, reject)=>{

    // when it reaches the terminal requested as src
    if(trip && trip.visitedTerminal && tripRequest.srcLoc._id && mongoose.Types.ObjectId(trip.visitedTerminal._id).equals(tripRequest.srcLoc._id) && trip.toDestination) {
      return resolve(0);
    }

    let sequenceNo = trip.visitedTerminal && trip.visitedTerminal.sequenceNo || 0;
    let pipelineStages = [
      {
        $match: {_id: mongoose.Types.ObjectId(trip._id)}
      }, {
        $unwind: "$driver.route.terminals"
      }
    ];

    if((tripRequest.srcLoc.sequenceNo<sequenceNo) && trip.toDestination) {

      pipelineStages.push({
        $match: {
          $or: [
            {"driver.route.terminals.sequenceNo": {$lt: tripRequest.srcLoc.sequenceNo}},
            {"driver.route.terminals.sequenceNo": {$gte: sequenceNo}}
          ]
        }
      })
    } else if(((tripRequest.srcLoc.sequenceNo<=sequenceNo) || (tripRequest.srcLoc.sequenceNo>sequenceNo)) && !trip.toDestination) {

      pipelineStages.push({
        $match: {
          "driver.route.terminals.sequenceNo": {$lt: tripRequest.srcLoc.sequenceNo}
        }
      })
    } else if(tripRequest.srcLoc.sequenceNo>sequenceNo && trip.toDestination) {

      pipelineStages.push({
        $match: {
            $and:[
              {"driver.route.terminals.sequenceNo": {$lt: tripRequest.srcLoc.sequenceNo}},
              {"driver.route.terminals.sequenceNo": {$gte: sequenceNo}}
            ]

        }
      })
    }

    pipelineStages.push({
      $group: {
        _id: "_id",
        eta: {$sum: "$driver.route.terminals.timeToNextTerminal"}
      }
    })

    TripSchema.aggregateAsync(pipelineStages)
    .then((result)=>{
      if(result && result.length && trip.toDestination) {
        let etaObj = result[0];
        if((sequenceNo == 0) || (tripRequest.srcLoc.sequenceNo<sequenceNo)) {
          etaObj.eta += trip.driver && trip.driver.route && trip.driver.route.stopDurationSource || 0;
        }
        tripToNextTerminalTimeAsync(trip, tripRequest).then(time=>{
          etaObj.eta+=time;
          return resolve(etaObj.eta);
        }).catch(err=>{
          return reject(err);
        })
        // return resolve(etaObj.eta)
      } else if (!trip.toDestination) {
        if(((tripRequest.srcLoc.sequenceNo<=sequenceNo) || (tripRequest.srcLoc.sequenceNo>sequenceNo))){
          pipelineStages[2] = {
            $match: {
              "driver.route.terminals.sequenceNo": {$lt: sequenceNo}
            }
          }
          TripSchema.aggregateAsync(pipelineStages)
          .then(reverseTerminalsResult=>{
            let totalEta = null;
            if(reverseTerminalsResult && reverseTerminalsResult.length) {
              totalEta = reverseTerminalsResult[0].eta;
              if(result && result.length) {
                totalEta += result[0].eta
              }
            }

            // check for stop duration
            if(tripRequest.srcLoc.type != TERMINAL_TYPES.TRIP_START_TERMINAL) {
              totalEta += trip.driver && trip.driver.route && trip.driver.route.stopDurationSource || 0;
            }

            // check for current shuttle loc to next terminal time
            tripToNextTerminalTimeAsync(trip, tripRequest).then(time=>{
              return resolve(totalEta+time);
            }).catch(err=>{
              return reject(err);
            })

          })
          .catch((err)=>{
            return reject(err);
          })
        } else {
          if(tripRequest.srcLoc.sequenceNo<sequenceNo) {
            etaObj.eta += trip.driver && trip.driver.route && trip.driver.route.stopDurationSource || 0;
          }
          return resolve(etaObj.eta)
        }
      } else {
        tripToNextTerminalTimeAsync(trip, tripRequest).then(time=>{
          return resolve(time);
        }).catch(err=>{
          return reject(err);
        })
        // return resolve(null);
      }
    })
    .catch((err)=>{
      return reject(err);
    })
  })
}

export function dynamicRouteAsyncETA(tripRequest, trip){

  return new Promise((resolve, reject)=>{
    if(trip && trip.visitedTerminal && tripRequest.srcLoc._id && mongoose.Types.ObjectId(trip.visitedTerminal._id).equals(tripRequest.srcLoc._id)) {
      return resolve(0);
    }

    let pipelineStages = [
      {
        $match: {_id: mongoose.Types.ObjectId(trip._id)}
      }, {
        $unwind: "$driver.route.terminals"
      }
    ];

    pipelineStages.push({
      $match: {
        $and: [
          {"driver.route.terminals.sequenceNo": {$lt: tripRequest.srcLoc.sequenceNo}},
          {"driver.route.terminals.sequenceNo": {$gte: trip.visitedTerminal && trip.visitedTerminal.sequenceNo || 0}}
        ]
      }
    })

    pipelineStages.push({
      $group: {
        _id: "_id",
        eta: {$sum: "$driver.route.terminals.timeToNextTerminal"}
      }
    })
    TripSchema.aggregateAsync(pipelineStages)
    .then((result)=>{
      if(result && result.length) {
        let etaObj = result[0];
        // check for current shuttle loc to next terminal time
        tripToNextTerminalTimeAsync(trip, tripRequest).then(time=>{
          etaObj.eta+=time
          return resolve(etaObj.eta);
        }).catch(err=>{
          return reject(err);
        })

      } else {
        tripToNextTerminalTimeAsync(trip, tripRequest).then(time=>{
          // etaObj.eta+=time
          return resolve(time);
        }).catch(err=>{
          return reject(err);
        })
        // return resolve(null);
      }
    })
    .catch((err)=>{
      return reject(err);
    })
  })
}

export function sortDynamicDriversAsync(request, trips) {
  console.log("                                     ");
  console.log("request  ----  > sendRequestToDriver", JSON.stringify(request));
  console.log("                                     ");
  return new Promise((resolve, reject)=>{
    let tripsDuration =  _.clone(trips);
    // let src = request.sourceLoc.address.split(' ').join('%20');
    // let origins = [src];
    let origins = [request.sourceLoc.address];
    let destinations = tripsDuration.map(trip=>{
      let latLng = `${trip.gpsLoc[1]},${trip.gpsLoc[0]}`
      return latLng;
    })

    let destinationsPiped = destinations.join('|');

    destinations = JSON.stringify(destinations);
    // let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinationsPiped}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;
    // curl.setHeaders([
    //   'Content-Type:application/json'
    // ])
    // .get(encodeURI(uri))
    distanceMatrix(origins, destinationsPiped)
    .then(result=>{
    console.log("                     ");
    console.log("                     ");
    console.log("DIstance result", JSON.stringify(result));
    console.log("                     ");
    console.log("                     ");
      let durations = JSON.parse(result.body);
      if(durations.status == "OK") {
        let originToDrivers = durations.rows[0] && durations.rows && durations.rows[0].elements && (durations.rows[0].elements[0].status == "OK") && durations.rows[0].elements;
        _.forEach(tripsDuration, (trip, index)=>{
          trip["duration"] = originToDrivers[index].duration.value;
        })
        return resolve(_.orderBy(tripsDuration, ['duration', ['asc']]));
      } else {
        return reject(new Error(`Error from google api's`));
      }
    })
    .catch(err=>{
      return reject(err);
    })
  })

}

export function addReorderDynamicTerminal(terminalToAdd, tripData, initTripRequest){

  return new Promise((resolve, reject)=>{

    TripSchema.findOne({_id: tripData._id})
    .then(trip=>{
      if(trip) {
        // add src and dest as first request on the trip or when trip did not have any terminals
        if (initTripRequest) {
          let src = JSON.parse(JSON.stringify(initTripRequest.srcLoc));
          let dest = JSON.parse(JSON.stringify(initTripRequest.destLoc));
          let srclatLng = `${src.loc[1]},${src.loc[0]}`;
          let destlatLng = `${dest.loc[1]},${dest.loc[0]}`;
          // let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${srclatLng}&destinations=${destlatLng}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;
          // curl.setHeaders([
          //   'Content-Type:application/json'
          // ])
          // .get(encodeURI(uri))
          distanceMatrix(srclatLng,destlatLng)
          .then(response=>{
            let result = JSON.parse(response.body);
            if(result.status == 'OK') {
              let srcDuration = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements && result.rows[0].elements[0];
              src["sequenceNo"] = 1;
              src["timeToNextTerminal"] = srcDuration.duration.value;
              dest["sequenceNo"] = 2;
              dest["timeToNextTerminal"] = 0;
              let terminals = [src, dest];
              TripSchema.findOneAndUpdateAsync({_id: trip._id},{$push: {"driver.route.terminals": {$each: terminals}}}, {new: true})
              .then(result=>{
                if(result) {
                  updateTripRequestTerminalSeqNo(result.driver.route.terminals);
                }
                return resolve(result);
              }).catch(err=>{
                return reject(err);
              })
            } else {
              return reject(new Error("Something went wrong getting time information"));
            }
          })
          .catch(err=>{
            return reject(err);
          })
        } else {
          if(!terminalToAdd || !trip || !trip.driver.route.terminals) {
            return reject(new Error("Invalid Params to calculate time between each terminal"));
          } else {
            let currentTerminals = JSON.parse((JSON.stringify(trip.driver.route.terminals)));

            currentTerminals = _.orderBy(currentTerminals, ['sequenceNo', ['asc']]);
            let newTerminal = JSON.parse((JSON.stringify(terminalToAdd)));
            newTerminal["customType"] = "new";
            // place new terminal on last
            currentTerminals.push(newTerminal);
            console.log("routeTerminals", currentTerminals);
            // let src = request.sourceLoc.address.split(' ').join('%20');
            // let origins = [src];
            let tripLocLatLng = `${trip.gpsLoc[1]},${trip.gpsLoc[0]}`;

            let destinations = currentTerminals.map(terminal=>{
              let latLng = `${terminal.loc[1]},${terminal.loc[0]}`;
              return latLng;
            })

            let destinationsPiped = destinations.join('|');

            // let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${tripLocLatLng}&destinations=${destinationsPiped}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;

            // console.log("uri>>>>>>>>>>>>>>", uri);
            // curl.setHeaders([
            //   'Content-Type:application/json'
            // ])
            // .get(encodeURI(uri))
            distanceMatrix(tripLocLatLng, destinationsPiped)
            .then(result=>{
              let durations = JSON.parse(result.body);
              if(durations.status == "OK") {
                let shuttleToAllCurrentTerminals = durations.rows[0] && durations.rows && durations.rows[0].elements && (durations.rows[0].elements[0].status == "OK") && durations.rows[0].elements;
                console.log("distancematrix", JSON.stringify(shuttleToAllCurrentTerminals) );

                _.forEach(currentTerminals, (terminalDurationTemp, index)=>{

                  terminalDurationTemp["durationTemp"] = shuttleToAllCurrentTerminals[index].duration.value;
                  console.log("terminalDurationTemp", terminalDurationTemp);
                })

                currentTerminals = _.orderBy(currentTerminals, ['durationTemp', ['asc']]);
                console.log("sorted by duationTemp", currentTerminals);
                // let newTerminalIndex = _.findIndex(currentTerminals, newTerminal);
                // console.log("newterminalIndex", newTerminalIndex, newTerminal, JSON.stringify(currentTerminals));
                currentTerminals.forEach((terminal, index)=>{
                  // reassign sequenceNo
                  terminal["sequenceNo"] = index+1;
                  // remove temporary field
                  delete terminal.durationTemp;
                })
                updateSeqAndTimeTonextTerminal(currentTerminals, trip)
                .then(updatedTripRoute=>{
                  return resolve(updatedTripRoute);
                }).catch(err=>{
                  return reject(err);
                })
                // store each terminal with time to next terminal

                // let timeToNextTerminals = [];

                // check if terminal should be last in list
                // if(newTerminalIndex==(currentTerminals.length-1)) {
                //   // then update sequence for new terminal only
                //   timeToNextTerminals = [currentTerminals[newTerminalIndex-1], newTerminal];
                //   fromTerminalToTerminalDynamicAsync(timeToNextTerminals)
                //   .then(timeToNextTerminals=>{
                //     updateTerminalSeqDurationDynamic(trip, timeToNextTerminals).then(result=>{
                //       return resolve(result);
                //     })
                //     .catch(err=>{
                //       return reject(err);
                //     })
                //   })
                // } else if(newTerminalIndex>=0){
                //   // check if should be first or in between the list

                //   // update sequence of each terminal after the current terminal index
                //   // update timeToNextTerminal for the current terminal
                //   // update timeToNextTerminal for the previous terminal

                //   // if new terminal is in between the list
                //   if(newTerminalIndex>0) {
                //     timeToNextTerminals = [currentTerminals[newTerminalIndex-1], newTerminal, currentTerminals[newTerminalIndex+1]];
                //   } else {
                //     // if new terminal should be the first in remaining terminal to visit
                //     timeToNextTerminals = [newTerminal, currentTerminals[newTerminalIndex+1]];
                //   }
                //   fromTerminalToTerminalDynamicAsync(timeToNextTerminals)
                //   .then(timeToNextTerminals=>{
                //     updateTerminalSeqDurationDynamic(trip, timeToNextTerminals).then(result=>{
                //       return resolve(result);
                //     })
                //     .catch(err=>{
                //       return reject(err);
                //     })
                //   })
                // } else {
                //   return reject(new Error("something went wrong, while reordering terminals"));
                // }

              } else {
                return reject(new Error(`Error from google api's`));
              }
            })
            .catch(err=>{
              return reject(err);
            })
          }
        }
      } else {
        return reject(new Error("Trip not found"));
      }
    }).catch(err=>{
      return reject(err);
    })

  })

}

// function updateTerminalSeqDurationDynamic(trip, timeToNextTerminals){
//   console.log("updateTerminalSeqDurationDynamic", timeToNextTerminals);
//   return new Promise((resolve, reject)=>{
//     async.eachOf(timeToNextTerminals, (timeToNextTerminal, key, cb)=>{
//       if(timeToNextTerminal) {
//         let updates = {
//           "driver.route.terminals.$.sequenceNo": timeToNextTerminal.sequenceNo,
//           "driver.route.terminals.$.timeToNextTerminal": timeToNextTerminal.timeToNextTerminal
//         }

//         TripSchema.findOneAsync({_id: trip._id, "driver.route.terminals._id": timeToNextTerminal._id})
//         .then(tripData=>{
//           console.log("trip terminals found as>>>>", JSON.stringify(trip));
//           if(tripData) {
//             TripSchema.updateOneAsync({_id: trip._id, "driver.route.terminals._id": timeToNextTerminal._id},
//             {$set: updates}, {new: true})
//             .then(result=>{
//               console.log("update existing terminal", JSON.stringify(result));
//               return cb();
//             }).catch(err=>{
//               return cb(err);
//             })
//           } else {
//             TripSchema.findOneAndUpdateAsync({_id: trip._id},
//               {$push: {"driver.route.terminals":timeToNextTerminal}}, {new: true})
//             .then(result=>{
//               console.log("new terminals added", JSON.stringify(result));
//               return cb();
//             }).catch(err=>{
//               return cb(err);
//             })
//           }
//         }).catch(err=>{
//           return cb(err);
//         })

//       } else {
//         return cb();
//       }

//     }, (err)=>{
//       if(err){
//         console.log("errror", err);
//         return reject(new Error(`Error updating time on each terminal`));
//       } else {
//         // update timeToNextTerminal for previous terminal
//         return resolve(timeToNextTerminals);
//       }
//     })
//   })
// }

// function fromTerminalToTerminalDynamicAsync(routeTerminals){
//   console.log("routeterminals", routeTerminals);
//   return new Promise((resolve, reject)=>{
//     if(!routeTerminals || !Array.isArray(routeTerminals)) {
//       return reject(new Error("Invalid Params to calculate time between each terminal"));
//     } else {

//       let fromTerminalToTerminalTimePromises = [];
//       routeTerminals.forEach((terminal, index)=>{
//         // if new terminal is in between the list
//         if(routeTerminals.length === 3) {
//           // update sequence and timeToNextTerminal for prev and newterminal

//           //update sequence number of all terminal after the current terminal

//         } else {
//           // check if new should be first or in between the list

//           // check if new terminal should be last in list

//         }

//         console.log("terminal to update", terminal);
//         let src = terminal.address.split(' ').join('%20');
//         let des = "";
//         if(index<routeTerminals.length-1) {
//           des = routeTerminals[index+1].address.split(' ').join('%20');
//         } else if((index == (routeTerminals.length-1)) && terminal && terminal.customType && (terminal.customType == 'new')) {
//           des = routeTerminals[index].address.split(' ').join('%20');
//         }

//         let promiseDuration =  function (callback){

//           curl.setHeaders([
//             'Content-Type:application/json'
//           ])
//           .get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${src}&destinations=${des}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`)
//           .then(result=>{
//             return callback(null, JSON.parse(result.body));
//           })
//           // .catch(err=>{
//           //   return callback(err);
//           // })

//         }

//         if((index<(routeTerminals.length-1)) || (terminal.customType && (terminal.customType == 'new'))) {
//           fromTerminalToTerminalTimePromises.push(promiseDuration);
//         }
//       })

//       console.log("fromTerminalToTerminalTimePromises", fromTerminalToTerminalTimePromises);
//       async.series(fromTerminalToTerminalTimePromises, (err, results)=>{
//         console.log("async series results", err, results);
//         if(err) {
//           return reject(err);
//         }
//         let routeTerminalsTime = routeTerminals.map((terminal, index)=>{
//           console.log("route terminal>>>>>",terminal, index);
//           if((index==(routeTerminals.length-1)) && (terminal.customType && (terminal.customType == 'new'))) {
//             terminal["timeToNextTerminal"] = 0;
//             return terminal;
//           }
//           let result = results[index];
//           console.log('routeTerminalsTime to resolve', result, terminal, index);
//           if(result && result.status == "OK") {
//             terminal["timeToNextTerminal"] = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
//           }
//           if(!terminal.timeToNextTerminal) {
//             terminal["timeToNextTerminal"] = 0;
//           }
//           return terminal;
//         })
//         console.log("routeTerminalsTime>>>>>>>>>>>", routeTerminalsTime);
//         return resolve(routeTerminalsTime);
//       })
//     }
//   })
// }

function updateSeqAndTimeTonextTerminal(orderedTerminals, trip){
  return new Promise((resolve, reject)=>{
    let fromTerminalToTerminalTimePromises = orderedTerminals.map((terminal, index)=>{
      return (callback)=>{
        if(index === (orderedTerminals.length-1)) {
          terminal["timeToNextTerminal"] = 0;
          return callback(null, terminal);
        } else {

          let src = terminal.address.split(' ').join('%20');
          let des = orderedTerminals[index+1].address.split(' ').join('%20');
          // curl.setHeaders([
          //   'Content-Type:application/json'
          // ])
          // .get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${src}&destinations=${des}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`)
          distanceMatrix(src, des)
          .then(results=>{
            let result = JSON.parse(results.body);
            terminal["timeToNextTerminal"] = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
            return callback(null, terminal);
          })
          .catch(err=>{
            return callback(err, null);
          })

        }
      }
    })

    async.series(fromTerminalToTerminalTimePromises, (err, results)=>{
      console.log("async series results", err, results);
      if(err) {
        return reject(err);
      }
      TripSchema.findOneAndUpdate({_id: trip._id}, {$set: {"driver.route.terminals": results}}, {new: true}).then(updateTripRoute=>{
        updateTripRequestTerminalSeqNo(updateTripRoute.driver.route.terminals)
        return resolve(updateTripRoute);
      }).catch(err=>{
        return reject(err);
      })
    })
  })
}

function updateTripRequestTerminalSeqNo(terminals){
  return new Promise((resolve, reject)=>{
    async.eachOf(terminals,
      function(terminal, key, cb){

        TripRequestSchema.update({"tripRequestStatus": TRIP_REQUEST_STATUS.TRIP_REQUEST_ACCEPTED, "srcLoc._id": terminal._id}, {$set: {"srcLoc.sequenceNo": terminal.sequenceNo}}, {multi: true})
        // DriverRouteTerminalSchema.insertMany(terminals)
        .then((savedTerminal) => {
          cb()
        })
        .catch((e) => {
          console.log("err>>>>>>>>>>>", e);
          cb(e);
        });
      },
      function(e){
        if(e) {
          return reject(e);
        } else {
          return resolve(terminals);
        }
      }
    )
  })
}

function distanceMatrix(origins, destinations, options=null) {
  return new Promise((resolve, reject)=>{
    let uri = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=imperial&mode=driving&key=${GOOGLE_API_KEY}`;
    console.log("distancematrixuri", uri);
    var requestOptions = {
      url: encodeURI(uri),
      headers: {
        'Content-Type':'application/json'
      }
    };

    function callbackDistance(error, response, body) {
      if (!error) {
        return resolve(response);
      } else {
        return reject(error);
      }
    }
    request(requestOptions, callbackDistance);
  })
}

function tripToNextTerminalTimeAsync(trip, triprequest) {
  console.log("calling next terminal>>>>>>>" );
  return new Promise((resolve, reject)=>{
    let orderedTerminals = _.orderBy(trip.driver.route.terminals, ['sequenceNo', ['asc']]);
    let nextTerminal = orderedTerminals[0];
    let tripLocLatLng = `${trip.gpsLoc[1]},${trip.gpsLoc[0]}`;
    let reqSrclatLng = `${nextTerminal.loc[1]},${nextTerminal.loc[0]}`;
    if(!trip.visitedTerminal) {
      nextTerminal = triprequest.srcLoc;
      reqSrclatLng = `${nextTerminal.loc[1]},${nextTerminal.loc[0]}`;
      //time from trip current location to the source(static route) or source of first terminal to visit in dynamic route
      distanceMatrix(tripLocLatLng, reqSrclatLng)
      .then(response=>{
        let result = JSON.parse(response.body);
        let timeToSrc = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
        return resolve(timeToSrc || 0);
      })
      .catch(err=>{
        return reject(err)
      })
    } else {
      // time from current loc of trip to the next terminal to visit
      let nextTerminalIndex = _.findIndex(orderedTerminals, {"sequenceNo": trip.visitedTerminal.sequenceNo+1});
      console.log("next terminal index>>>>>>>>>>>>", nextTerminalIndex);
      if(nextTerminalIndex>-1) {
        nextTerminal = orderedTerminals[nextTerminalIndex];
        reqSrclatLng = `${nextTerminal.loc[1]},${nextTerminal.loc[0]}`;
        distanceMatrix(tripLocLatLng, reqSrclatLng)
        .then(response=>{
          let result = JSON.parse(response.body);
          let timeToSrc = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
          console.log("time??????????????", timeToSrc);
          return resolve(timeToSrc || 0);
        })
        .catch(err=>{
          return reject(err);
        })
      } else if ((trip.driver.tripType == TRIP_TYPES.TRIP_CIRCULAR_STATIC) && !trip.toDestination) {
        let nextTerminalIndex = _.findIndex(orderedTerminals, {"sequenceNo": trip.visitedTerminal.sequenceNo-1});
        if(nextTerminalIndex>-1) {
          nextTerminal = orderedTerminals[nextTerminalIndex];
          reqSrclatLng = `${nextTerminal.loc[1]},${nextTerminal.loc[0]}`;
          distanceMatrix(tripLocLatLng, reqSrclatLng)
          .then(response=>{
            let result = JSON.parse(response.body);
            let timeToSrc = result.rows[0] && result.rows && result.rows[0].elements && (result.rows[0].elements[0].status == "OK") && result.rows[0].elements[0].duration.value;
            return resolve(timeToSrc || 0);
          })
          .catch(err=>{
            return reject(err);
          })
        } else {
          return resolve(0);
        }
      } else {
        return resolve(0);
      }
    }
  })
}

