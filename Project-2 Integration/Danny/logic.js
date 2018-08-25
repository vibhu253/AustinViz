var marker_map = L.markerClusterGroup();
var heatArray = [];
var camMarkers = L.markerClusterGroup();
var camHeatArray = [];

// var myMap = L.map("map", {
//   center: [30.2672, -97.7431],
//   zoom: 11
// });

// L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
//   attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
//   maxZoom: 18,
//   id: "mapbox.streets",
//   accessToken: API_KEY
// }).addTo(myMap);


//Traffic Incidents-------------------------------------------------------------------------------
var baseURL = "https://data.austintexas.gov/resource/r3af-2r8x.json?";
var date = "$where=traffic_report_status_date_time between'2010-01-10T12:00:00' and '2018-08-15T14:00:00'";
var limit = "&$limit=10000";
var trafficUrl = baseURL + date + limit;
d3.json(trafficUrl).then(successHandle,errorHandle);
function errorHandle(error){
  console.log(error)
}
function successHandle(response) {
  // console.log(response);
  marker_map = L.markerClusterGroup();
  heatArray = [];

  for (var i = 0; i < response.length; i++) {
    // console.log(response[i]);
    if(response[i].location){
      var location = [response[i].latitude, response[i].longitude];
      heatArray.push([response[i].latitude, response[i].longitude]);
      marker_map.addLayer(L.marker([location[0], location[1]])
            .bindPopup(response[i].issue_reported));
    }
  }
  // console.log(markers);
  // myMap.addLayer(markers);

  var heat_map = L.heatLayer(heatArray, {
    radius: 20,
    blur: 35
  });
  
  createMap(marker_map,heat_map);
}

// console.log(heat);


//Traffic Cameras-------------------------------------------------------------------------------
// baseURL = "https://data.austintexas.gov/resource/fs3c-45ge.json?";
// limit = "&$limit=600";
// var cameraUrl = baseURL + limit;
// d3.json(cameraUrl).then(camSuccessHandle,camErrorHandle);

// function camErrorHandle(error){
//   console.log(error)
// }
// function camSuccessHandle(response) {
//   // console.log(response);
//   camMarkers = L.markerClusterGroup();
//   camHeatArray = [];
//   for (var i = 0; i < response.length; i++) {
//     // console.log(response[i].location.coordinates);
//     if(response[i].location){
//       var camLocation = response[i].location.coordinates;
//       camHeatArray.push([camLocation[1], camLocation[0]]);
//       camMarkers.addLayer(L.marker([camLocation[1], camLocation[0]])
//             .bindPopup(response[i].location_name));
//     }
//   }
//   // console.log(camMarkers);
//   myMap.addLayer(camMarkers);
// }
// var camHeat = L.heatLayer(camHeatArray, {
//   radius: 20,
//   blur: 35
// });
// console.log(camHeat);

function createMap(markers,heat){
  //Map Building-------------------------------------------------------------------------------
  var streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.streets",
      accessToken: API_KEY
  });
  var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.dark",
      accessToken: API_KEY
  });

  var baseMaps = {
      "Street Map": streetmap,
      "Dark Map": darkmap
  };

  var overlayMaps = {
      Traffic: markers,
      "Traffic (Heat)": heat
      // Cameras: camMarkers,
      // "Cameras (Heat)": camHeat
  };

    var myMap = L.map("map", {
      center: [30.36, -97.7431],
      zoom: 10,
      layers: [streetmap, markers]
    });
  myMap.addLayer(markers);
  myMap.addLayer(camMarkers);

  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
}
