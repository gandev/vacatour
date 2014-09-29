Meteor.methods({
  'vacatour/removeTourpoint': function(point) {
    check(point, Object);
    check(routeFrom, Match.OneOf(Object, undefined, null));
    check(routeTo, Match.OneOf(Object, undefined, null));

    var tourId = point.tourId;

    var routeFrom = Routes.findOne({
      tourId: tourId,
      to: point && point._id
    });

    var routeTo = Routes.findOne({
      tourId: tourId,
      from: point && point._id
    });

    Points.remove(point._id);

    if (routeTo || routeFrom) {
      Routes.remove(routeTo && routeTo._id || routeFrom._id);
    }

    if (routeTo) {
      Points.update({
        tourId: tourId,
        number: {
          '$gt': point.number
        }
      }, {
        '$inc': {
          number: -1
        }
      }, {
        multi: true
      });

      if (routeFrom) {
        Routes.update(routeFrom._id, {
          '$set': {
            to: routeTo.to
          }
        });
      }
    }
  },
  'vacatour/switchTourpoints': function(pointOne, pointTwo) {
    check(pointOne, Object);
    check(pointTwo, Object);
    check(toOne, Match.OneOf(Object, null, undefined));
    check(fromOne, Match.OneOf(Object, null, undefined));
    check(toTwo, Match.OneOf(Object, null, undefined));
    check(fromTwo, Match.OneOf(Object, null, undefined));

    var tourId = pointOne.tourId;
    var tour = Tours.findOne(tourId);

    if (!tour) return;

    var toOne = Routes.findOne({
      tourId: tourId,
      to: pointOne && pointOne._id
    });

    var fromOne = Routes.findOne({
      tourId: tourId,
      from: pointOne && pointOne._id
    });

    var toTwo = Routes.findOne({
      tourId: tourId,
      to: pointTwo && pointTwo._id
    });

    var fromTwo = Routes.findOne({
      tourId: tourId,
      from: pointTwo && pointTwo._id
    });

    Points.update(pointOne._id, {
      '$set': {
        number: pointTwo.number
      }
    });

    Points.update(pointTwo._id, {
      '$set': {
        number: pointOne.number
      }
    });

    if (toOne) {
      Routes.update(toOne._id, {
        '$set': {
          to: pointTwo._id
        }
      });
    }

    if (fromOne) {
      Routes.update(fromOne._id, {
        '$set': {
          from: pointTwo._id
        }
      });
    }

    if (toTwo) {
      Routes.update(toTwo._id, {
        '$set': {
          to: pointOne._id
        }
      });
    }

    if (fromTwo) {
      Routes.update(fromTwo._id, {
        '$set': {
          from: pointOne._id
        }
      });
    }
  }
});
