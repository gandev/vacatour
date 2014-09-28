Points = new Mongo.Collection(null);
Routes = new Mongo.Collection(null);

updatePointsAndRoutes = function(tour) {
  //TODO removing all performant enough and no flicker...

  Points.remove({
    tourId: tour._id
  });

  Routes.remove({
    tourId: tour._id
  });

  _.each(tour.points, function(point) {
    Points.insert(point);
  });

  _.each(tour.routes, function(route) {
    Routes.insert(route);
  });
};

var switchPoints = function(pointOne, pointTwo) {
  var tourId = pointOne.tourId;

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

  if (pointOne && pointTwo) {
    Meteor.call('vacatour/switchTourpoints', pointOne, pointTwo, toOne, fromOne, toTwo, fromTwo);
  }
};

UI.body.helpers({
  currentTour: function() {
    return Tours.findOne();
  }
});

UI.body.events({
  'click #create-new-tour': function() {
    Tours.insert({
      points: [],
      routes: []
    });
  }
});

Template.tour.rendered = function() {
  updatePointsAndRoutes(this.data);

  //TODO necessary to prevent from rerendering?
  this.map = new TourMap(this.data);
};

Template.tour.helpers({
  tourPoints: function() {
    return Points.find({
      tourId: this._id
    }, {
      sort: {
        number: 1
      }
    });
  },
  routeTo: function() {
    return Routes.findOne({
      to: this._id
    });
  }
});

Template.tour.events({
  'click .remove-tourpoint': function() {
    var routeFrom = Routes.findOne({
      tourId: this.tourId,
      to: this && this._id
    });

    var routeTo = Routes.findOne({
      tourId: this.tourId,
      from: this && this._id
    });

    Meteor.call('vacatour/removeTourpoint', this, routeFrom, routeTo);
  },
  'click .move-tourpoint-up': function() {
    var previousPoint = Points.findOne({
      tourId: this.tourId,
      number: this.number - 1
    });

    switchPoints(previousPoint, this);
  },
  'click .move-tourpoint-down': function() {
    var nextPoint = Points.findOne({
      tourId: this.tourId,
      number: this.number + 1
    });

    switchPoints(this, nextPoint);
  }
});

var recalculateMapHeight = function() {
  var mapHeight = $(window).height() - $('.navigation-container').height();

  $('.map-container').height(mapHeight);
};

Meteor.startup(function() {
  recalculateMapHeight();

  $(window).on('resize', function() {
    recalculateMapHeight();
  });
});
