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
  },
  'vacatour/removeTourpoint': function(tourpoint, previousRouteId, nextPointId) {
    check(tourpoint, Object);
    check(previousRouteId, Match.OneOf(String, undefined, null));
    check(nextPointId, Match.OneOf(String, undefined, null));

    var tourId = tourpoint.tourId;
    var tour = Tours.findOne(tourId); //needs to be fetched before pull of points

    if (!tour) return;

    Tours.update(tourId, {
      '$pull': {
        'points': {
          _id: tourpoint._id
        }
      }
    });

    Tours.update(tourId, {
      '$pull': {
        'routes': {
          _id: tourpoint.routeFromHere || previousRouteId
        }
      }
    });

    if (nextPointId) {
      for (var nr = tourpoint.number + 1; nr < tour.points.length; nr++) {
        Tours.update({
          _id: tourId,
          'points.number': nr
        }, {
          '$inc': {
            'points.$.number': -1
          }
        });
      }

      if (previousRouteId) {
        Tours.update({
          _id: tourId,
          'routes._id': previousRouteId
        }, {
          '$set': {
            'routes.$.to': nextPointId
          }
        });
      }
    }
  },
  'vacatour/switchTourpoints': function(pointOne, pointTwo) {
    check(pointOne, Object);
    check(pointTwo, Object);

    Tours.update({
      _id: pointOne.tourId,
      'points._id': pointOne._id
    }, {
      '$set': {
        'points.$.number': pointTwo.number
      }
    });

    Tours.update({
      _id: pointTwo.tourId,
      'points._id': pointTwo._id
    }, {
      '$set': {
        'points.$.number': pointOne.number
      }
    });

    //TODO switch route
  }
});
