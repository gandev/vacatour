Meteor.methods({
  'vacatour/removeTourpoint': function(point, routeFrom, routeTo) {
    check(point, Object);
    check(routeFrom, Match.OneOf(Object, undefined, null));
    check(routeTo, Match.OneOf(Object, undefined, null));

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

    if (routeTo || routeFrom) {
      Tours.update(tourId, {
        '$pull': {
          'routes': {
            _id: routeTo && routeTo._id || routeFrom._id
          }
        }
      });
    }

    if (routeTo) {
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

      if (routeFrom) {
        Tours.update({
          _id: tourId,
          'routes._id': routeFrom._id
        }, {
          '$set': {
            'routes.$.to': routeTo.to
          }
        });
      }
    }
  },
  'vacatour/switchTourpoints': function(pointOne, pointTwo, toOne, fromOne, toTwo, fromTwo) {
    check(pointOne, Object);
    check(pointTwo, Object);
    check(toOne, Match.OneOf(Object, null, undefined));
    check(fromOne, Match.OneOf(Object, null, undefined));
    check(toTwo, Match.OneOf(Object, null, undefined));
    check(fromTwo, Match.OneOf(Object, null, undefined));

    var tourId = pointOne.tourId;
    var tour = Tours.findOne(tourId);

    if (!tour) return;

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

    if (toOne) {
      Tours.update({
        _id: tourId,
        'routes._id': toOne._id
      }, {
        '$set': {
          'routes.$.to': pointTwo._id
        }
      });
    }

    if (fromOne) {
      Tours.update({
        _id: tourId,
        'routes._id': fromOne._id
      }, {
        '$set': {
          'routes.$.from': pointTwo._id
        }
      });
    }

    if (toTwo) {
      Tours.update({
        _id: tourId,
        'routes._id': toTwo._id
      }, {
        '$set': {
          'routes.$.to': pointOne._id
        }
      });
    }

    if (fromTwo) {
      Tours.update({
        _id: tourId,
        'routes._id': fromTwo._id
      }, {
        '$set': {
          'routes.$.from': pointOne._id
        }
      });
    }
  }
});
