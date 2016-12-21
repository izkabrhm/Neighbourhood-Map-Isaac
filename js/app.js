'use strict';
//Initialize the map
var map;

//Calling initMap() to display map and markers
function initMap(){
  //Style given to map
  var styles = [
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "color": "#365779"
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "stylers": [
            {
                "color": "#042e58"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "stylers": [
            {
                "color": "#a51a1d"
            }
        ]
    },
    {
        "featureType": "road.local",
        "stylers": [
            {
                "color": "#808080"
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "stylers": [
            {
                "color": "#808080"
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "elementType": "labels.text",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "weight": 0.1
            }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            {
                "color": "#365779"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "water"
    },
    {
        "featureType": "transit",
        "stylers": [
            {
                "color": "#365779"
            }
        ]
    }  
  ];

  //Setting the map
	map = new google.maps.Map(document.getElementById('map'),{
    center:{lat: 40.732398, lng: -74.005317},
    zoom: 12,
    styles: styles,
    mapTypeControl: false
    });

  //This Listener is called to resize and center the map to a specific marker
  google.maps.event.addDomListener(window, 'resize', function() {
   var center = map.getCenter();
   google.maps.event.trigger(map, 'resize');
   map.setCenter(center); 
  });

  //Initialize markers
  var markers = [];

  //Initialize the infoWindow
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
        map.setCenter(this.getPosition());
        viewModel.markerAnimation(this);
        viewModel.getNYTimes(this, largeInfowindow);
    	});
    	bounds.extend(markers[i].position);
	}
  //map.setCenter(bounds.getCenter());
	map.fitBounds(bounds);
  //Kick starts everything!
  var viewModel;
  ko.applyBindings(viewModel = new ViewModel(markers,largeInfowindow));
}

var ViewModel = function(markers,largeInfowindow){
	var self = this;
  //var largeInfowindow = new google.maps.InfoWindow();
  self.markLoc = ko.observableArray(markers);
  self.filteredMarkLoc = ko.observableArray();
  self.filterLoc = ko.observable('');

  //Function used to create content for infowindow
  self.populateInfoWindow = function(marker, infowindow,articleHeader, articleContent) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      infowindow.marker = marker;
      infowindow.setContent('');
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick',function(){
        infowindow.setMarker = null;
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
            infowindow.setContent('<div class="info"><div><h3>' + marker.title + '</h3><p>'+marker.address+'</p></div><div id="pano"></div><br><div class="nyt"><h4 id="nyt-header">'+articleHeader+'</h4><ul id="nyt-article">'+articleContent+'</ul></div></div></div>');
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
 };

 //Sets up an event listener for clicking a list element
  self.listClicker = function(filteredMarkLoc){
    self.getNYTimes(this,largeInfowindow);
    self.markerAnimation(this);
  };

  

  //Sets up an event listener for filtering the list after search form is clicked
  self.filterList = ko.computed(function(){
    self.filteredMarkLoc.removeAll();
    var searchString = self.filterLoc();
    var searchStr = searchString.toLowerCase();
    var len = self.markLoc().length;
    console.log(searchString);
    if(!self.filterLoc()){
      for(var i = 0 ; i < len ; i++){
        self.markLoc()[i].setVisible(true);
      }
      return self.markLoc();
    }else{    
      for(var i = 0 ; i < len ; i++){
        var markTitle = self.markLoc()[i];
        var mark = markTitle.title.toLowerCase();
        if(mark.indexOf(searchStr) > -1){
          self.filteredMarkLoc.push(markTitle);
          self.markLoc()[i].setVisible(true);
        }else {
          self.markLoc()[i].setVisible(false);
        }
      }
      return self.filteredMarkLoc();
    }
  });
 
  //Function to retrieve data from New York Times sites through NY Times API
  self.getNYTimes = function(marker,largeInfowindow){
    var nytimesUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + marker.title + '&sort=newest&api-key=a2b419fa02c746609c8d9f045104b797';
    $.getJSON(nytimesUrl, function(data){
        var articleContent = '';
        console.log(data);
        var articleHeader = 'New York Times article about'+marker.title;
        var articles = data.response.docs;
        console.log(articles.length);
        if(articles.length!==0){
          for(var i=0 ; i<articles.length; i++){
              var article = articles[i];
              var art = '<li class="article"><a href="'+article.web_url+'">'+article.headline.main+'</a></li>';
              articleContent = articleContent.concat(art);
          }
        }else{
          art = '<p class="article">No Articles found on'+marker.title+'</p>';
          articleContent = articleContent.concat(art);
        }
        self.populateInfoWindow(marker,largeInfowindow,articleHeader,articleContent);   
    }).error(function(e){
        //$('#nyt-header').text('New York Times article could not be loaded');
        articleHeader = 'New York Times article could not be loaded';
        articleContent = '';
        self.populateInfoWindow(marker,largeInfowindow,articleHeader,articleContent);
    });
  };

  //Animates marker when it is clicked
  self.markerAnimation = function(marker){
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout( function() { marker.setAnimation(null); }, 1400);
  };
};

var googleError = function(){
    alert("Your Google API Key is not valid");
};
	

