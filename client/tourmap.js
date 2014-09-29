TourMap = function(tour) {
  var self = this;

  self.tour = tour;
  self.markers = {};
  self.lines = {};
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

  self.map.setCenter(new google.maps.LatLng(0, 0));

  Points.find({
    tourId: tour._id
  }).observe({
    added: function(point) {
      self.renderPoint(point);

      self.adjustBounds();
    },
    changed: function(newPoint) {
      self.renderPoint(newPoint);

      self.adjustBounds();
    },
    removed: function(point) {
      self.removePoint(point);

      self.adjustBounds();
    }
  });

  Routes.find({
    tourId: tour._id
  }).observe({
    added: function(route) {
      //TODO good pattern?
      Tracker.autorun(function() {
        var updatedRoute = Routes.findOne(route._id);

        if (updatedRoute) {
          var pointFrom = Points.findOne(updatedRoute.from);
          var pointTo = Points.findOne(updatedRoute.to);

          if (pointFrom && pointTo) {
            self.renderRoute(updatedRoute, pointFrom, pointTo);
          }
        } else {
          self.removeRoute(route);
        }
      });
    }
  });

  //create places searchbox and link it to the input

  var searchInput = document.getElementById('places-search-' + tour._id);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInput);

  var searchBox = new google.maps.places.SearchBox(searchInput);

  // listen for place selected and marker on first one
  google.maps.event.addListener(searchBox, 'places_changed', function() {
    var place = searchBox.getPlaces()[0]; //TODO more than one needed?

    self.createTourpoint(place);
    searchInput.value = "";
  });

  //bias the SearchBox results towards places in map bounds
  google.maps.event.addListener(map, 'bounds_changed', function() {
    var bounds = map.getBounds();
    searchBox.setBounds(bounds);
  });
};

TourMap.prototype.requestPlace = function(placeId, callback) {
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

  _.each(Points.find().fetch(), function(point) {
    if (point.lat < self.latMin) {
      self.latMin = point.lat;
    }

    if (point.lat > self.latMax) {
      self.latMax = point.lat;
    }

    if (point.lng < self.lngMin) {
      self.lngMin = point.lng;
    }

    if (point.lng > self.lngMax) {
      self.lngMax = point.lng;
    }
  });

  self.map.fitBounds(
  new google.maps.LatLngBounds(
  new google.maps.LatLng(self.latMin, self.lngMin),
  new google.maps.LatLng(self.latMax, self.lngMax)
  ));
};

TourMap.prototype.removePoint = function(point) {
  var self = this;

  var marker = self.markers[point.placeId];

  if (marker) {
    marker.setMap(null);
  }
};

TourMap.prototype.renderPoint = function(point) {
  var self = this;

  self.removePoint(point);

  var latLng = new google.maps.LatLng(point.lat, point.lng);

  self.markers[point.placeId] = new google.maps.Marker({
    map: self.map,
    title: point.name,
    position: latLng
  });
};

TourMap.prototype.removeRoute = function(route) {
  var self = this;

  var line = self.lines[route._id];

  if (line) {
    line.setMap(null);
  }
};

TourMap.prototype.renderRoute = function(route, pointFrom, pointTo) {
  var self = this;

  if (pointFrom && pointTo) {
    var fromLatLng = new google.maps.LatLng(pointFrom.lat, pointFrom.lng);
    var toLatLng = new google.maps.LatLng(pointTo.lat, pointTo.lng);

    self.removeRoute(route);

    self.lines[route._id] = new google.maps.Polyline({
      map: self.map,
      path: new google.maps.MVCArray([fromLatLng, toLatLng])
    });
  }
};

TourMap.prototype.createTourpoint = function(place) {
  var self = this;

  var tourId = self.tour._id;

  var pointsCount = Points.find({
    tourId: tourId
  }).count();

  var previousPoint = Points.findOne({
    tourId: tourId,
    number: pointsCount - 1
  });

  var newPoint = {
    _id: Random.id(),
    tourId: tourId,
    number: pointsCount,
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address,
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng()
  };

  Points.insert(newPoint);

  if (previousPoint) {
    var newRoute = {
      _id: Random.id(),
      tourId: tourId,
      from: previousPoint._id,
      to: newPoint._id,
      transport: 'CAR'
    };

    Routes.insert(newRoute);
  }
};
