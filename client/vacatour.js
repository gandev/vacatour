Template.tour.rendered = function() {
  //TODO necessary to prevent from rerendering?
  this.map = new TourMap(this.data);
};

Template.tour.helpers({});
Template.tour.events({});

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
