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
  'vacatour/removeTourpoint': function(point, previousRouteId, nextPointId) {
    check(point, Object);
    check(previousRouteId, Match.OneOf(String, undefined, null));
    check(nextPointId, Match.OneOf(String, undefined, null));

    var tourId = point.tourId;
    var tour = Tours.findOne(tourId); //needs to be fetched before pull of points

    if (!tour) return;

    Tours.update(tourId, {
      '$pull': {
        'points': {
          _id: point._id
        }
      }
    });

    Tours.update(tourId, {
      '$pull': {
        'routes': {
          _id: point.routeFromHere || previousRouteId
        }
      }
    });

    if (nextPointId) {
      for (var nr = point.number + 1; nr < tour.points.length; nr++) {
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
  'vacatour/switchTourpoints': function(pointOne, pointTwo, previousPoint) {
    check(pointOne, Object);
    check(pointTwo, Object);
    check(previousPoint, Match.OneOf(previousPoint, null, undefined));

    var tourId = pointOne.tourId;
    var tour = Tours.findOne(tourId);

    Tours.update({
      _id: tourId,
      'points._id': pointOne._id
    }, {
      '$set': {
        'points.$.number': pointTwo.number
      }
    });

    Tours.update({
      _id: tourId,
      'points._id': pointTwo._id
    }, {
      '$set': {
        'points.$.number': pointOne.number
      }
    });

    if (previousPoint) {
      var routePrevious = _.find(tour.routes, function(route) {
        return route._id === previousPoint.routeFromHere;
      });

      Tours.update({
        _id: tourId,
        'routes._id': previousPoint.routeFromHere
      }, {
        '$set': {
          'routes.$.to': pointTwo._id
        }
      });
    }

    var routeTwo = _.find(tour.routes, function(route) {
      return route._id === pointTwo.routeFromHere;
    });

    Tours.update({
      _id: tourId,
      'routes._id': pointOne.routeFromHere
    }, {
      '$set': {
        'routes.$.to': routeTwo && routeTwo.to
      }
    });

    Tours.update({
      _id: tourId,
      'routes._id': pointTwo.routeFromHere || pointOne.routeFromHere
    }, {
      '$set': {
        'routes.$.to': pointOne._id
      }
    });

    if (!pointTwo.routeFromHere) {
      Tours.update({
        _id: tourId,
        'points._id': pointTwo._id
      }, {
        '$set': {
          'points.$.routeFromHere': pointOne.routeFromHere
        }
      });

      Tours.update({
        _id: tourId,
        'points._id': pointOne._id
      }, {
        '$set': {
          'points.$.routeFromHere': null
        }
      });
    }
  }
});
