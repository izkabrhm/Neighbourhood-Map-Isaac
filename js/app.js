var map;
var markers = [];

function initMap(){
	map = new google.maps.Map(document.getElementById('map'),{
    center:{lat: 40.732398, lng: -74.005317},
    zoom: 12
    });

    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

	for (var i = 0; i < nycLocations.length; i++) {
		var position = nycLocations[i].latlng;
		var title = nycLocations[i].name;
    var address = nycLocations[i].address;

		var marker = new google.maps.Marker({
        	map: map,
        	position: position,
        	title: title,
          address: address,
        	animation: google.maps.Animation.DROP,
        	id: i
      	});
      	// Push the marker to our array of markers.
     	markers.push(marker);
      	// Create an onclick event to open an infowindow at each marker.
      	marker.addListener('click', function() {
        viewModel.populateInfoWindow(this, largeInfowindow);
      	});
      	bounds.extend(markers[i].position);
	}
 
	map.fitBounds(bounds);
  ko.applyBindings(viewModel = new ViewModel(markers,largeInfowindow));
};





var ViewModel = function(markers,largeInfowindow){
	var self = this;
  //var largeInfowindow = new google.maps.InfoWindow();
  console.log(markers)
  self.markLoc = ko.observableArray(markers);

  self.populateInfoWindow = function(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      infowindow.marker = marker;
      infowindow.setContent('');
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick',function(){
        infowindow.setMarker(null);
      });
      var streetViewService = new google.maps.StreetViewService();
      var radius = 50;
      // In case the status is OK, which means the pano was found, compute the
      // position of the streetview image, then calculate the heading, then get a
      // panorama from that and set the options
      function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
          var nearStreetViewLocation = data.location.latLng;
          var heading = google.maps.geometry.spherical.computeHeading(
            nearStreetViewLocation, marker.position);
            infowindow.setContent('<div><h3>' + marker.title + '</h3><p>'+marker.address+'</p></div><div id="pano"></div>');
            var panoramaOptions = {
              position: nearStreetViewLocation,
              pov: {
                heading: heading,
                pitch: 30
              }
            };
          var panorama = new google.maps.StreetViewPanorama(
            document.getElementById('pano'), panoramaOptions);
        } else {
          infowindow.setContent('<div>' + marker.title + '</div>' +
            '<div>No Street View Found</div>');
        }
      }
      // Use streetview service to get the closest streetview image within
      // 50 meters of the markers position
      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }
 }

  self.listClicker = function(markLoc){
    self.populateInfoWindow(markLoc,largeInfowindow);
  }
}
	

