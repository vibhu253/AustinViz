
// set color scale
function getColorMi(d) {
  return d > 90000 ? '#99000d' :
         d > 80000  ? '#cb181d' :
         d > 70000  ? '#ef3b2c' :
         d > 60000  ? '#fb6a4a' :
         d > 50000   ? '#fc9272' :
         d > 40000   ? '#fcbba1' :
         d > 30000   ? '#fee0d2' :
                    '#fff5f0';
}

function getColorHvi(d) {
  return d > 750000 ? '#99000d' :
         d > 650000  ? '#cb181d' :
         d > 550000  ? '#ef3b2c' :
         d > 450000  ? '#fb6a4a' :
         d > 350000   ? '#fc9272' :
         d > 250000   ? '#fcbba1' :
         d > 150000   ? '#fee0d2' :
                    '#fff5f0';
}

// Link to GeoJSON
const geoJsonLink = "https://raw.githubusercontent.com/sid83/project2Data/master/result.geojson";

var geojson;

// Grabbing data with d3...
d3.json(geoJsonLink).then(successHandle, errorHandle);
 
function errorHandle(error){
  console.log(error)
}

function successHandle(data) {

  // Creating a new choropleth layer
  var hviLayer = L.geoJson(data, {
    style: function style(feature) {
      return {
          fillColor: getColorHvi(feature.properties.hvi),
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
      };
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(feature.properties.zipcode  + "<br>Home Value Index:<br>" +
        "$" + feature.properties.hvi)
    }
  })

  var miLayer = L.geoJson(data, {
    style: function style(feature) {
      return {
          fillColor: getColorMi(feature.properties.mi),
          weight: 2,
          opacity: 1,
          color: 'black',
          dashArray: '3',
          fillOpacity: 0.7
      };
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(feature.properties.zipcode  + "<br>Median Household Income:<br>" +
        "$" + feature.properties.mi)
    }
  })


  // Adding tile layer
  var streetMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: API_KEY
  });
  // Create a baseMaps object
  var baseMaps = {
    "Street Map": streetMap
  };

  // Create an overlay object
  var overlayMaps = {
    "Home Value Index": hviLayer,
    "Median Income": miLayer
  };

  // Define a map object
  // Creating map object
  var myMap = L.map("map", {
    center: [30.291164, -97.721035],
    zoom: 10.5,
    layers: [streetMap, hviLayer]
  });

  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);



}
