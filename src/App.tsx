import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Feature, Geometry } from "geojson";
import L from "leaflet";

const irelandBounds: [number, number][] = [
  [51.222, -10.664], // Southwest
  [55.436, -5.996], // Northeast
];

// Define the properties type for counties
interface CountyProperties {
  GID_0: string;
  NAME_0: string;
  GID_1: string;
  NAME_1: string; // The county name
  VARNAME_1?: string;
  NL_NAME_1?: string | null;
  TYPE_1?: string;
  ENGTYPE_1?: string;
  CC_1?: string | null;
  HASC_1?: string;
}

function App() {
  const position: [number, number] = [53.3498, -6.2603]; // Dublin
  const [countyData, setCountyData] = useState<GeoJSON.FeatureCollection<
    Geometry,
    CountyProperties
  > | null>(null);

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection<Geometry, CountyProperties>) => {
        setCountyData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  const onEachFeature = (
    feature: Feature<Geometry, CountyProperties>,
    layer: L.Layer,
  ) => {
    if (feature.properties) {
      layer.bindPopup(`<b>${feature.properties.NAME_1}</b>`);

      layer.on("click", () => {
        console.log("Clicked county:", feature.properties.NAME_1);
      });
    }
  };

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
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default App;
