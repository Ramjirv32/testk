
var map;

function initMap() {

	map = new google.maps.Map(document.getElementById('simple-map'), {
		center: {
			lat: -34.397,
			lng: 150.644
		},
		zoom: 8
	});

	var myLatLng = {
		lat: -25.363,
		lng: 131.044
	};
	var map = new google.maps.Map(document.getElementById('marker-map'), {
		zoom: 4,
		center: myLatLng
	});
	var marker = new google.maps.Marker({
		position: myLatLng,
		map: map,
		title: 'Hello World!'
	});

	var overlay;
	USGSOverlay.prototype = new google.maps.OverlayView();

	function initMap() {
		var map = new google.maps.Map(document.getElementById('overlay-map'), {
			zoom: 11,
			center: {
				lat: 62.323907,
				lng: -150.109291
			},
			mapTypeId: 'satellite'
		});
		var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(62.281819, -150.287132), new google.maps.LatLng(62.400471, -150.005608));

		var srcImage = 'https://developers.google.com/maps/documentation/' + 'javascript/examples/full/images/talkeetna.png';

		overlay = new USGSOverlay(bounds, srcImage, map);
	}
	
	function USGSOverlay(bounds, image, map) {

		this.bounds_ = bounds;
		this.image_ = image;
		this.map_ = map;

		this.div_ = null;

		this.setMap(map);
	}
	

	USGSOverlay.prototype.onAdd = function () {
		var div = document.createElement('div');
		div.style.borderStyle = 'none';
		div.style.borderWidth = '0px';
		div.style.position = 'absolute';

		var img = document.createElement('img');
		img.src = this.image_;
		img.style.width = '100%';
		img.style.height = '100%';
		img.style.position = 'absolute';
		div.appendChild(img);
		this.div_ = div;

		var panes = this.getPanes();
		panes.overlayLayer.appendChild(div);
	};
	USGSOverlay.prototype.draw = function () {

		var overlayProjection = this.getProjection();

		var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
		var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

		var div = this.div_;
		div.style.left = sw.x + 'px';
		div.style.top = ne.y + 'px';
		div.style.width = (ne.x - sw.x) + 'px';
		div.style.height = (sw.y - ne.y) + 'px';
	};

	USGSOverlay.prototype.onRemove = function () {
		this.div_.parentNode.removeChild(this.div_);
		this.div_ = null;
	};
	google.maps.event.addDomListener(window, 'load', initMap);

	var map = new google.maps.Map(document.getElementById('polygons-map'), {
		zoom: 5,
		center: {
			lat: 24.886,
			lng: -70.268
		},
		mapTypeId: 'terrain'
	});

	var triangleCoords = [{
		lat: 25.774,
		lng: -80.190
	}, {
		lat: 18.466,
		lng: -66.118
	}, {
		lat: 32.321,
		lng: -64.757
	}, {
		lat: 25.774,
		lng: -80.190
	}];

	var bermudaTriangle = new google.maps.Polygon({
		paths: triangleCoords,
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.35
	});
	bermudaTriangle.setMap(map);

	var map = new google.maps.Map(document.getElementById('style-map'), {
		center: {
			lat: 40.674,
			lng: -73.945
		},
		zoom: 12,
		styles: [{
			elementType: 'geometry',
			stylers: [{
				color: '#242f3e'
			}]
		}, {
			elementType: 'labels.text.stroke',
			stylers: [{
				color: '#242f3e'
			}]
		}, {
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#746855'
			}]
		}, {
			featureType: 'administrative.locality',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#d59563'
			}]
		}, {
			featureType: 'poi',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#d59563'
			}]
		}, {
			featureType: 'poi.park',
			elementType: 'geometry',
			stylers: [{
				color: '#263c3f'
			}]
		}, {
			featureType: 'poi.park',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#6b9a76'
			}]
		}, {
			featureType: 'road',
			elementType: 'geometry',
			stylers: [{
				color: '#38414e'
			}]
		}, {
			featureType: 'road',
			elementType: 'geometry.stroke',
			stylers: [{
				color: '#212a37'
			}]
		}, {
			featureType: 'road',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#9ca5b3'
			}]
		}, {
			featureType: 'road.highway',
			elementType: 'geometry',
			stylers: [{
				color: '#746855'
			}]
		}, {
			featureType: 'road.highway',
			elementType: 'geometry.stroke',
			stylers: [{
				color: '#1f2835'
			}]
		}, {
			featureType: 'road.highway',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#f3d19c'
			}]
		}, {
			featureType: 'transit',
			elementType: 'geometry',
			stylers: [{
				color: '#2f3948'
			}]
		}, {
			featureType: 'transit.station',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#d59563'
			}]
		}, {
			featureType: 'water',
			elementType: 'geometry',
			stylers: [{
				color: '#17263c'
			}]
		}, {
			featureType: 'water',
			elementType: 'labels.text.fill',
			stylers: [{
				color: '#515c6d'
			}]
		}, {
			featureType: 'water',
			elementType: 'labels.text.stroke',
			stylers: [{
				color: '#17263c'
			}]
		}]
	});
}

