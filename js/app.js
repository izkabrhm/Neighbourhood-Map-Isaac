var map;
var markers = [];

function initMap(){
	map = new google.maps.Map(document.getElementById('map'),{
    center:{lat: 40.732398, lng: -74.005317},
    zoom: 12
    });

  google.maps.event.addDomListener(window, "resize", function() {
   var center = map.getCenter();
   google.maps.event.trigger(map, "resize");
   map.setCenter(center); 
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
        map.setCenter(this.getPosition())
        viewModel.getNYTimes(this);
        viewModel.populateInfoWindow(this, largeInfowindow);
      	});
      	bounds.extend(markers[i].position);
	}
  //map.setCenter(bounds.getCenter());
	map.fitBounds(bounds);
  ko.applyBindings(viewModel = new ViewModel(markers,largeInfowindow));
};

var ViewModel = function(markers,largeInfowindow){
	var self = this;
  //var largeInfowindow = new google.maps.InfoWindow();
  self.markLoc = ko.observableArray(markers);
  self.filteredMarkLoc = ko.observableArray(markers);
  self.filterLoc = ko.observable("");

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
            infowindow.setContent('<div class="info"><div><h3>' + marker.title + '</h3><p>'+marker.address+'</p></div><div id="pano"></div><br><div class="nyt"><h4 id="nyt-header"></h4><ul id="nyt-article"></ul></div></div></div>');
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

  self.listClicker = function(filteredMarkLoc){
    self.populateInfoWindow(filteredMarkLoc,largeInfowindow);
  }

  var len = self.markLoc().length;

  self.filterList = function(){
    var searchString = self.filterLoc();
    var searchStr = searchString.toLowerCase();
    self.filteredMarkLoc([])
    for(var i = 0 ; i < len ; i++){
      var markTitle = self.markLoc()[i];
      var mark = markTitle.title.toLowerCase();
      if(mark.indexOf(searchStr) > -1){
        self.filteredMarkLoc.push(markTitle);
        self.markLoc()[i].setMap(map);
      }else {
        self.markLoc()[i].setMap(null);
      }
    }
  }

  self.getNYTimes = function(marker){
    var nytimesUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + marker.title + '&sort=newest&api-key=a2b419fa02c746609c8d9f045104b797'
    $.getJSON(nytimesUrl, function(data){
        console.log(data);
        $('#nyt-header').text('New York Times article about ' + marker.title);

        articles = data.response.docs;
        console.log(articles.length);
        if(articles.length!==0){
          for(i=0 ; i<3; i++){
              var article = articles[i];
                $('#nyt-article').append('<li class="article">'+'<a href="'+article.web_url+'">'+article.headline.main+'</a></li>');
          };
        }else{
          $('#nyt-article').append('<p class="article">No Articles found on'+marker.title+'</p>');
        }   
    }).error(function(e){
        $('#nyt-header').text('New York Times article could not be loaded');
    });
  }
  
}
	

