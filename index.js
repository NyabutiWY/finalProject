import kiambu_suitability from "./kiambu_suit.js";

var coord = [-1.183, 37.117];
var map = L.map("map").setView(coord, 15);
var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const southwest = [-0.7492605935410523, 36.42414663046995];
const northeast = [-1.3641416388587118, 37.475949540026704];

const rectangle = L.rectangle([[southwest, northeast]], {
  color: "blue",
  weight: 1,
  fillOpacity: 0.0,
}).addTo(map);
const bounds = rectangle.getBounds();
// Fit the map to the bounds of the bounding box
map.fitBounds(bounds);

function getColor(d) {
  if (d > 5) {
    return "#FC4E2A";
  } else if (d > 4) {
    return "#FD8D3C";
  } else if (d > 3) {
    return "#FEB24C";
  } else if (d > 2) {
    return "#FED976";
  } else {
    return "#FFEDA0";
  }
}

// function getColor(d) {
//   if (d > 10) {
//     return "#006d2c";
//   } else if (d > 5) {
//     return "#31a354";
//   } else if (d > 2) {
//     return "#74c476";
//   } else if (d > 1) {
//     return "#bae4b3";
//   } else {
//     return "#edf8e9";
//   }
// }

function style(feature) {
  const minPropertyValue = feature.properties.MIN;

  const fillColor = getColor(minPropertyValue);

  return {
    fillColor: fillColor,
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
    backdropFilter: "blur(6px)",
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7,
  });

  layer.bringToFront();
  info.update(layer.feature.properties);
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}

var geojson;
geojson = L.geoJson(kiambu_suitability, {
  style: style,
  onEachFeature: onEachFeature,
}).addTo(map);

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info");
  this.update();
  return this._div;
};

const mediaQuery = window.matchMedia("(max-width:500px");

info.update = function (props) {
  this._div.innerHTML =
    "<h4>Kiambu Basil suitability</h4>" +
    (props
      ? "<b>" + props.NAME_5 + "</b><br />" + props.MIN
      : mediaQuery.matches
      ? "click on sublocation"
      : "Hover over sublocation");
};

info.addTo(map);

let suitability_values = {
  1: "Unsuitable",
  2: "Marginally unsuitable",
  3: "Marginally suitable",
  4: "Moderately suitable",
  5: "Highly suitable",
};

var legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
  var div = L.DomUtil.create("div", "info legend"),
    labels = [];

  for (var key in suitability_values) {
    labels.push(
      '<span  class="legend-item" style="background:' +
        getColor(parseInt(key) + 1) +
        '"></span> ' +
        suitability_values[key]
    );
  }

  div.innerHTML = labels.join("<br>");
  return div;
};

legend.addTo(map);

const searchInput = document.querySelector("#search-input");
const resultBox = document.querySelector(".result-box");

const filteredFeatures = kiambu_suitability.features.map((feature) => {
  return feature.properties.NAME_5.toLowerCase();
});

searchInput.onkeydown = function () {
  let result = [];
  let input = searchInput.value;

  if (input.length) {
    result = filteredFeatures.filter((keyword) => {
      return keyword.toLowerCase().includes(input.toLowerCase());
    });
  }
  display(result);
};

function display(result) {
  const content = result.map((list) => {
    return `<li class="sublocation"> ${list} </li>`;
  });

  resultBox.innerHTML = `<ul class="ul"> ${content.join("")} </ul>`;

  const sublocationItems = document.querySelectorAll(".sublocation");

  let highlightedLayer = null;

  sublocationItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const clickedSublocation = e.target.textContent.trim().toLowerCase();

      let selectedFeature = kiambu_suitability.features.find((feature) => {
        const featureName = feature.properties.NAME_5.trim().toLowerCase();
        return featureName === clickedSublocation;
      });

      if (selectedFeature) {
        clearPrevious();

        const bounds = L.geoJSON(selectedFeature).getBounds();
        map.fitBounds(bounds);

        // Calculate centroid of the polygon
        const centroid = L.geoJSON(selectedFeature).getBounds().getCenter();
        const sublocationName = selectedFeature.properties.NAME_5;

        // Store the selected feature for highlighting
        highlightedLayer = L.geoJSON(selectedFeature, {
          style: function (feature) {
            const minPropertyValue = feature.properties.MIN;
            const fillColor = getColor(minPropertyValue);

            return {
              fillColor: fillColor,
              color: "red",
              weight: 3,
              opacity: 1,
              fillOpacity: 0.5,
            };
          },
        }).addTo(map);
      }

      // Update info panel with selected sublocation's properties
      info.update(selectedFeature.properties);

      // Function to clear existing highlighted layer and marker
      function clearPrevious() {
        if (highlightedLayer) {
          map.removeLayer(highlightedLayer);
          highlightedLayer = null;
        }
      }
    });
  });
}

let copyright = document.querySelector(".copyright");
const date = new Date().getFullYear();
copyright.insertAdjacentHTML("beforeend", `<span> ${date} </span>`);
