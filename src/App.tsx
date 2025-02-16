import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Feature, Geometry } from "geojson";
import { Button } from "./components/ui/button";

const irelandBounds: [number, number][] = [
  [51.222, -10.664], // Southwest
  [55.436, -5.996], // Northeast
];

interface CountyProperties {
  GID_0: string;
  NAME_0: string;
  GID_1: string;
  NAME_1: string; // English county name
  NAME_2: string; // Northern-Ireland counties
  VARNAME_1?: string; // Irish County name
  NL_NAME_1?: string | null;
  TYPE_1?: string;
  ENGTYPE_1?: string;
  CC_1?: string | null;
  HASC_1?: string;
  COUNTY_ID: number; // NI Geo-Json
  CountyName: string; // NI Geo-Json
}

function App() {
  const position: [number, number] = [53.3498, -6.2603]; // Dublin - starting point
  const [countyData, setCountyData] = useState<GeoJSON.FeatureCollection<
    Geometry,
    CountyProperties
  > | null>(null);

  let borderColor = "rgba(107,107,239,0.89)"; // Border color
  let countyFillColour = "#c2c2e8"; // Fill color

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection<Geometry, CountyProperties>) => {
        console.log(data.features);
        setCountyData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  const onEachFeature = (
    feature: Feature<Geometry, CountyProperties>,
    layer: L.Layer,
  ) => {
    if (feature.properties) {

      // Northern Ireland Counties
      if(feature.properties.COUNTY_ID){
        const formattedCountyName =  (str: string) => str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
        layer.bindPopup(`<b>${formattedCountyName(feature.properties.CountyName)}</b>`);
      }else{
        // Ireland Counties
        layer.bindPopup(`<b>${feature.properties.NAME_1}</b>`);
      }
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Button>Hi there</Button>
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
              color: borderColor,
              weight: 2,
              opacity: 1,
              fillColor: countyFillColour,
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
