Template.map.helpers({});
Template.map.events({});

Tracker.autorun(function() {
  var tour = Vacatour.findOne('test1');

  if (tour && !GoogleMaps._maps[tour._id]) {
    GoogleMaps.add('map-canvas', tour);
  }
});
