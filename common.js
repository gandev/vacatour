Meteor.methods({
  'vacatour/addRouteToPoint': function(tourId, pointId, routeId) {
    check(tourId, String);
    check(pointId, String);
    check(routeId, String);

    Tours.update({
      _id: tourId,
      'points._id': pointId
    }, {
      '$set': {
        'points.$.routeFromHere': routeId
      }
    });
  }
});
