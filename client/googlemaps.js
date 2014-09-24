GoogleMaps = {
  _maps: {},
  _markers: [],
  currentCenter: new ReactiveVar(null),
  currentZoom: new ReactiveVar(4)
};

GoogleMaps.add = function(divToRender, tour) {
  divToRender = divToRender instanceof HTMLDivElement ? divToRender : document.getElementById(divToRender);

  if (!divToRender) return; //TODO error

  var mapOptions = _.extend({
    zoom: GoogleMaps.currentZoom.get(),
    mapTypeId: google.maps.MapTypeId.MAP
  }, mapOptions);

  var map = new google.maps.Map(divToRender, mapOptions);
  GoogleMaps._maps[tour._id] = map;

  map.setCenter(new google.maps.LatLng(tour.lat, tour.lng));

  // var circle = new google.maps.Circle({
  //   map: map,
  //   radius: 1000000,
  //   fillColor: 'blue',
  //   center: map.getCenter()
  // });

  google.maps.event.addListener(map, 'center_changed', function() {
    GoogleMaps.currentCenter.set({
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
  });

  google.maps.event.addListener(map, 'rightclick', function(evt) {
    var marker = new google.maps.Marker({
      map: map,
      position: evt.latLng
    });

    GoogleMaps._markers.push(evt.latLng);

    var route = new google.maps.Polyline({
      map: map,
      path: new google.maps.MVCArray(GoogleMaps._markers)
    });
  });
};

Tracker.autorun(function() {
  var latLng = GoogleMaps.currentCenter.get();

  //TODO debounce

  if (latLng) {
    Vacatour.upsert('test1', {
      _id: 'test1',
      lat: latLng.lat,
      lng: latLng.lng
    });
  }
});
