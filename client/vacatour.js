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
    var tour = Template.parentData();

    Tours.update(tour._id, {
      '$pull': {
        'points': {
          _id: this._id
        }
      }
    });

    //TODO update other routes

    Tours.update(tour._id, {
      '$pull': {
        'routes': {
          _id: this.routeFromHere
        }
      }
    });
  },
  'click .move-tourpoint-up': function() {
    var tour = Template.parentData();


  },
  'click .move-tourpoint-down': function() {
    var tour = Template.parentData();


  }
});

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
