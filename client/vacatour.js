UI.body.helpers({
  currentTour: function() {
    return Tours.findOne();
  }
});

UI.body.events({
  'click #create-new-tour': function() {
    Tours.insert({
      name: "new tour"
    });
  }
});

Template.tour.rendered = function() {
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
    Meteor.call('vacatour/removeTourpoint', this);
  },
  'click .move-tourpoint-up': function() {
    var previousPoint = Points.findOne({
      tourId: this.tourId,
      number: this.number - 1
    });

    if (previousPoint) {
      Meteor.call('vacatour/switchTourpoints', previousPoint, this);
    }
  },
  'click .move-tourpoint-down': function() {
    var nextPoint = Points.findOne({
      tourId: this.tourId,
      number: this.number + 1
    });

    if (nextPoint) {
      Meteor.call('vacatour/switchTourpoints', this, nextPoint);
    }
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
