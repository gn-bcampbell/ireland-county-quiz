import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

const irelandBounds: [number, number][] = [
  [51.222, -10.664], // Southwest
  [55.436, -5.996],  // Northeast
];

function App() {
  const position: [number, number] = [53.3498, -6.2603]; // Dublin
  const [countyData, setCountyData] = useState<any>(null);

  // fetch geojson from /public folder
  useEffect(() => {
    fetch("/ireland-counties.geojson")
        .then((res) => res.json())
        .then((data) => setCountyData(data))
        .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <MapContainer
            center={position}
            zoom={7}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
            maxBounds={irelandBounds}
            maxBoundsViscosity={1.0}
        >
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png"
          />

          {/* Render county boundaries */}
          {countyData && (
              <GeoJSON
                  data={countyData}
                  style={() => ({
                    color: "rgba(107,107,239,0.89)", // Border color
                    weight: 2,
                    opacity: 1,
                    fillColor: "#c2c2e8", // Fill color
                    fillOpacity: 0.5,
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`<b>${feature.properties.name}</b>`); // Show county name
                  }}
              />
          )}

          {/* Optional: Marker in Dublin */}
          {/*<Marker position={position}>*/}
          {/*  <Popup>Welcome to Ireland!</Popup>*/}
          {/*</Marker>*/}
        </MapContainer>
      </div>
  );
}

export default App;
