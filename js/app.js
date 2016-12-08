var map;

function initMap(){
		map = new google.maps.Map(document.getElementById('map'),{
	        center:{lat: 40.712784, lng: -74.005941},
	        zoom: 10
	       });
	};

var ViewModel = function(){
	var self = this;
	this.markerLoc = ko.observableArray([]);

	nycLocations.forEach(function(nycLoc){
		self.markerLoc.push(nycLoc);
	});

	

ko.applyBindings(new ViewModel());