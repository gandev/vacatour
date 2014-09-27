Points = new Mongo.Collection(null);
Routes = new Mongo.Collection(null);

Template.tour.rendered = function() {
  //TODO necessary to prevent from rerendering?
  this.map = new TourMap(this.data);
};

Template.tour.helpers({
  pointsAndRoutes: function() {
    var self = this;

    //TODO removing all performant enough and no flicker...
    Points.remove({
      tourId: self._id
    });

    Routes.remove({
      tourId: self._id
    });

    _.each(self.points, function(point) {
      Points.insert(point);
    });

    _.each(self.routes, function(route) {
      Routes.insert(route);
    });

    return Points.find({
      tourId: self._id
    }, {
      sort: {
        number: 1
      }
    });
  },
  route: function() {
    return Routes.findOne({
      from: this._id
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


    //TODO remove route + update other routes

    // Tours.update(tour._id, {
    //   '$pull': {
    //     'routes': {
    //       _id:
    //     }
    //   }
    // });
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
