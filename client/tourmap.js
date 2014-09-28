TourMap = function(tour) {
  var self = this;

  self.places = {};
  self.connections = {};
  self.latMin = 90;
  self.latMax = -90;
  self.lngMin = 180;
  self.lngMax = -180;

  //setup the map

  var mapDiv = document.getElementById('map-canvas-' + tour._id);

  var map = new google.maps.Map(mapDiv, {
    zoom: 4,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  self.map = map;

  self.requestPlaces(_.map(tour.points, function(point) {
    return point.placeId;
  }), function() {
    self.renderTour(tour);
  });

  var tourObserve = Tours.find(tour._id).observe({
    changed: function(newTour) {
      updatePointsAndRoutes(newTour);
      self.renderTour(newTour); //TODO don't render the whole tour on any change
    },
    removed: function() {
      Routes.remove({});
      Points.remove({});
      tourObserve.stop();
    }
  });

  //create places searchbox and link it to the input

  var searchInput = document.getElementById('places-search-' + tour._id);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInput);

  var searchBox = new google.maps.places.SearchBox(searchInput);

  // listen for place selected and marker on first one
  google.maps.event.addListener(searchBox, 'places_changed', function() {
    var place = searchBox.getPlaces()[0]; //TODO more than one needed?
    self.places[place.place_id] = place;

    self.createTourpoint(place);

    searchInput.value = "";
  });

  //bias the SearchBox results towards places in map bounds
  google.maps.event.addListener(map, 'bounds_changed', function() {
    var bounds = map.getBounds();
    searchBox.setBounds(bounds);
  });
};

TourMap.prototype.requestPlaces = function(placeIds, callback) {
  var self = this;

  placeIds = placeIds || [];

  if (placeIds.length === 0) {
    callback();
  }

  var service = new google.maps.places.PlacesService(self.map);

  var countRequests = placeIds.length;

  _.each(placeIds || [], function(placeId) {
    service.getDetails({
      placeId: placeId
    }, function(place, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        self.places[place.place_id] = place;
      }

      countRequests--;
      if (countRequests === 0) {
        callback();
      }
    });
  });
};

TourMap.prototype.adjustBounds = function() {
  var self = this;

  _.each(self.places, function(place) {
    var latLng = place.geometry.location;

    if (latLng.lat() < self.latMin) {
      self.latMin = latLng.lat();
    }

    if (latLng.lat() > self.latMax) {
      self.latMax = latLng.lat();
    }

    if (latLng.lng() < self.lngMin) {
      self.lngMin = latLng.lng();
    }

    if (latLng.lng() > self.lngMax) {
      self.lngMax = latLng.lng();
    }
  });

  self.map.fitBounds(
  new google.maps.LatLngBounds(
  new google.maps.LatLng(self.latMin, self.lngMin),
  new google.maps.LatLng(self.latMax, self.lngMax)
  ));
};

TourMap.prototype.addPlaceMarker = function(place) {
  var self = this;

  place.marker = new google.maps.Marker({
    map: self.map,
    title: place.name,
    position: place.geometry.location
  });

  self.adjustBounds();
};

TourMap.prototype.renderTour = function(tour) {
  var self = this;

  self.tour = tour;

  _.each(self.places, function(place) {
    if (place.marker) {
      place.marker.setMap(null);
    }
  });

  _.each(self.connections, function(connection) {
    connection.setMap(null);
  });

  _.each(self.tour.points, function(point) {
    var place = self.places[point.placeId];

    if (place) {
      self.addPlaceMarker(place);
      self.renderRoute(point);
    }
  });

  if (tour.points.length === 0) {
    self.map.setCenter(new google.maps.LatLng(0, 0));
  }
};

TourMap.prototype.renderRoute = function(pointFrom) {
  var self = this;

  var route = Routes.findOne(pointFrom.routeFromHere);

  if (!route) return;

  var pointTo = Points.findOne(route.to);

  var placeFrom = pointFrom && self.places[pointFrom.placeId];
  var placeTo = pointTo && self.places[pointTo.placeId];

  if (placeFrom && placeTo) {
    if (self.connections[route._id]) {
      //necessary because sometimes line wasn't cleared
      self.connections[route._id].setMap(null);
    }

    self.connections[route._id] = new google.maps.Polyline({
      map: self.map,
      path: new google.maps.MVCArray([placeFrom.geometry.location, placeTo.geometry.location])
    });
  }
};

TourMap.prototype.createTourpoint = function(place) {
  var self = this;

  if (!place) {
    return;
  }

  var tourId = self.tour._id;

  var previousPoint = Points.findOne({
    tourId: tourId,
    number: self.tour.points.length - 1
  });

  var newPoint = {
    _id: Random.id(),
    tourId: tourId,
    number: self.tour.points.length,
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address
  };

  var newRoute = {
    _id: Random.id(),
    tourId: tourId,
    to: newPoint._id,
    transport: 'CAR'
  };

  if (previousPoint) {
    Tours.update(tourId, {
      '$push': {
        points: newPoint,
        routes: newRoute
      }
    });
  } else {
    Tours.update(tourId, {
      '$push': {
        points: newPoint
      }
    });
  }

  if (previousPoint) {
    //TODO use a tour startpoint of sorts if no previousPoint
    Meteor.call('vacatour/addRouteToPoint', tourId, previousPoint._id, newRoute._id);
  }
};
