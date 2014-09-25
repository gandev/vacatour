TourMap = function(tour) {
  var self = this;

  self.tour = tour;
  self.places = {};
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

  _.each(tour.points, function(point) {
    self.addTourpointMarker(point.placeId);
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

    self.addPlaceMarker(place);

    var tourpoints = self.tour.points;
    //TODO
    tourpoints.push({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address
    });

    Tours.update(tour._id, {
      '$set': {
        points: tourpoints
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

  var marker = new google.maps.Marker({
    map: self.map,
    title: place.name,
    position: place.geometry.location
  });

  self.places[place.place_id] = place;

  self.adjustBounds();

  //TODO
  self.connectTourPoints();
};

TourMap.prototype.addTourpointMarker = function(placeId) {
  var self = this;

  self.getPlace(placeId, function(place) {
    self.addPlaceMarker(place);
  });
};

TourMap.prototype.connectTourPoints = function() {
  var self = this;

  var route = new google.maps.Polyline({
    map: self.map,
    path: new google.maps.MVCArray(_.map(self.places, function(place) {
      return place.geometry.location;
    }))
  });
};
