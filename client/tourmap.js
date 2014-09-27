TourMap = function(tour) {
  var self = this;

  self.tour = tour;
  self.places = {};
  self.tourLines = {};
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

  var rerenderTour = function(newTour) {
    self.tour = newTour || self.tour;

    _.each(self.places, function(place) {
      place.marker.setMap(null);
    });

    _.each(self.tour.points, function(point) {
      self.addTourpointMarker(point);
    });
  };

  if (tour.points.length === 0) {
    map.setCenter(new google.maps.LatLng(0, 0));
  } else {
    rerenderTour();
  }

  Tours.find(tour._id).observe({
    changed: function(newTour) {
      rerenderTour(newTour);
    }
  });

  //create places searchbox and link it to the input

  var searchInput = document.getElementById('places-search-' + tour._id);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInput);

  var searchBox = new google.maps.places.SearchBox(searchInput);

  // listen for place selected and marker on first one
  google.maps.event.addListener(searchBox, 'places_changed', function() {
    var place = searchBox.getPlaces()[0]; //TODO more than one needed?

    if (!place) {
      return;
    }

    var tourpoints = self.tour.points;

    var previousPoint = Points.findOne({
      tourId: tour._id,
      number: tourpoints.length - 1
    });

    var newPoint = {
      _id: Random.id(),
      tourId: tour._id,
      number: tourpoints.length,
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address
    };

    var tourroutes = self.tour.routes;

    var newRoute;
    if (previousPoint) {
      newRoute = {
        _id: Random.id(),
        tourId: tour._id,
        from: previousPoint._id || null,
        to: newPoint._id,
        transport: 'CAR'
      };

      tourroutes.push(newRoute);
    }

    tourpoints.push(_.extend(newPoint, {
      routeId: newRoute && newRoute._id
    }));

    Tours.update(tour._id, {
      '$set': {
        points: tourpoints,
        routes: tourroutes
      }
    });

    //bias the SearchBox results towards places in map bounds
    google.maps.event.addListener(map, 'bounds_changed', function() {
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });
  });
};

TourMap.prototype.getPlace = function(placeId, callback) {
  var self = this;

  var service = new google.maps.places.PlacesService(self.map);

  service.getDetails({
    placeId: placeId
  }, function(place, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      callback(place);
    }
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

  self.places[place.place_id] = place;

  self.adjustBounds();
};

TourMap.prototype.addTourpointMarker = function(point) {
  var self = this;

  var place = self.places[point.placeId];

  if (place) {
    self.addPlaceMarker(place);
    self.renderRoute(Routes.findOne(point.routeId));
  } else {
    self.getPlace(point.placeId, function(place) {
      self.addPlaceMarker(place);
      self.renderRoute(Routes.findOne(point.routeId));
    });
  }
};

TourMap.prototype.renderRoute = function(route) {
  var self = this;

  if (!route) return;

  if (self.tourLines[route._id]) {
    self.tourLines[route._id].setMap(null);
  }

  var pointFrom = Points.findOne({
    _id: route.from,
    tourId: route.tourId
  });

  var pointTo = Points.findOne({
    _id: route.to,
    tourId: route.tourId
  });

  var placeFrom = pointFrom && self.places[pointFrom.placeId];
  var placeTo = pointTo && self.places[pointTo.placeId];

  if (placeFrom && placeTo) {
    self.tourLines[route._id] = new google.maps.Polyline({
      map: self.map,
      path: new google.maps.MVCArray([placeFrom.geometry.location, placeTo.geometry.location])
    });
  }
};
