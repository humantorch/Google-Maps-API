/**
* @author scottkosman
**/

// set global variables
var centerLat = 0.31543;	//starting location centered on Kampala, Uganda
var centerLong = 32.58124;
var startZoom = 13;
var pointsArray = [];	//initializing Array to store point data
var map;

var _map = {
	
	Point: function(point,location) {
	  this.point = point;
	  this.location = location;
	},

	init: function() {
		//event handlers for unit swap and reset inputs
		$("#units").change(function(){_math.unitSwap();});
		$("#reset").click(function(){_map.clearMap();});
		
		if (GBrowserIsCompatible()) {
			map = new GMap2(document.getElementById("mapBox"));
		
			var location = new GLatLng(centerLat, centerLong);
		
			map.setCenter(location, startZoom);
			map.setUIToDefault();
		
			var mapClick = GEvent.addListener(map, "click", function(overlay, location) {
				map.panTo(location, map.getZoom());
				_map.addPoint(location);
			});
		}
	},

	addPoint: function(location) {
		GEvent.clearListeners(map, "mousemove");
		var unit = $("#units").val();
	
		// creates new point and stores data in a series of variables
		var point = new GMarker(location,{clickable:false});
		var thisLat = location.lat();
		var thisLon = location.lng();
		var sumDist = parseFloat($("#sum_dist").val());
		
		// places new point in the map   
		map.addOverlay(point); 

		// add to array
		var pointClass = new _map.Point(point,location);
		pointsArray.push(pointClass);
		var pointsNum = pointsArray.length-1; // the -1 is here to settle right off the bat the difference between zero-based and one-based counting systems (array index numbers vs. number of array items)
	
		// Once a point has been added, track the coords of the mousepointer, use the Haversine Formula to calculate the distance from it to the last point added, and draw a line from the last point added to the coordinates of the mouse pointer
		var createBand = GEvent.addListener(map, "mousemove", function(mPoint){
			var mLat = mPoint.lat();
			var mLon = mPoint.lng();
			var dd = _math.haversine(thisLat, thisLon, mLat, mLon);
		
			$("#dyn_dist").val(dd);
		
			var mLine = new GPolyline([
				new GLatLng(thisLat,thisLon),
				new GLatLng(mLat,mLon)
			], "#000099", 2, 0.5,{clickable:false});
			map.addOverlay(mLine);
			
			// remove the currently-displayed 'rubber band' line -- both on mousemove and on click
			var removeBand = GEvent.addListener(map, "mousemove", function(){
				map.removeOverlay(mLine);
				GEvent.removeListener(removeBand); // garbage cleanup
			});
			var removeBandClick = GEvent.addListener(map, "click", function(){
				map.removeOverlay(mLine);
				GEvent.removeListener(removeBandClick); // garbage cleanup
			});
		});
	
		if(pointsNum>0) { //start calculating inter-point distance once there are more than one of them
			var lastLat=pointsArray[pointsNum-1].location.lat();
			var lastLon=pointsArray[pointsNum-1].location.lng();
			var d = _math.haversine(thisLat, thisLon, lastLat, lastLon); //calculate distance between the current point (last one in the array) and previous point (second-last one in the array) using the Haversine formula
		
			sumDist = sumDist + d;
			$("#dist").val(d);
			$("#sum_dist").val(sumDist);
			
			var mapLine = new GPolyline([
				new GLatLng(thisLat,thisLon),
				new GLatLng(lastLat,lastLon)
			], "#ff0000", 5, 0.5,{clickable:false});
		
			map.addOverlay(mapLine);
		}
	},

	clearMap: function() {
		// remove all point data from pointsArray, reset array, remove all points from the map, reset all distance counters to zero, remove mousemove event listener
		for (i = 0; i < pointsArray.length; i++) {
				map.removeOverlay(pointsArray[i].point);
			}
		pointsArray.length = 0;
		map.clearOverlays();
		$("#dist").val(0); $("#sum_dist").val(0);$("#dyn_dist").val(0);	
		GEvent.clearListeners(map, "mousemove") ;
	}
};

// ********** Math functions

Number.prototype.convToRad = function() {  // used to convert degrees to radians
  return this * Math.PI / 180;
};

var _math = {	
// http://en.wikipedia.org/wiki/Haversine_formula		
	haversine: function(lat2, lon2, lat1, lon1) {
		var unit = $("#units").val(),
			R = (unit === "km") ? 6371 : 6371000,
			dLat = (lat2-lat1).convToRad(),
			dLon = (lon2-lon1).convToRad(),
			a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1.convToRad()) * Math.cos(lat2.convToRad()) * Math.sin(dLon/2) * Math.sin(dLon/2),
			c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
			d = R * c;
		return d;
	},
	
	unitSwap: function() {		// Unit swapping in form fields
		var unit = $("#units").val(),
			d = $("#dist").val(),
			sd = $("#sum_dist").val(),
			dd = $("#dyn_dist").val();
		if (unit==="m"){
			d = d*1000; sd = sd*1000; dd = dd*1000;
		} else {
			d = d/1000; sd = sd/1000; dd = dd/1000;
		}
		$("#dist").val(d);$("#sum_dist").val(sd);$("#dyn_dist").val(dd);
	}
};