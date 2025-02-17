import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Feature, Geometry } from "geojson";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";

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

export default function Map() {
  const position: [number, number] = [53.3498, -6.2603]; // Dublin - starting point
  const [countyData, setCountyData] = useState<GeoJSON.FeatureCollection<
    Geometry,
    CountyProperties
  > | null>(null);
  const [selectedCounties, setSelectedCounties] = useState<Set<number>>(
    new Set(),
  ); // Store selected county IDs
  const [noCountyFound, setNoCountyFound] = useState<boolean>(false);

  const borderColor = "rgba(255,255,255,0.89)"; // Border color
  const defaultFillColor = "#c2c2e8"; // Default fill color
  const selectedFillColor = "green"; // Selected fill color

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection<Geometry, CountyProperties>) => {
        setCountyData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  const formSchema = z.object({
    countyName: z.string().min(0),
  });

  const onEachFeature = (
    feature: Feature<Geometry, CountyProperties>,
    // layer: L.Layer,
  ) => {
    if (feature.properties) {
      // Use a unique identifier
      // const countyId = feature.properties.COUNTY_ID || feature.properties.GID_1;
      //
      // // Convert NI counties to correct format: 'DOWN' to 'Down'
      // const formattedCountyName = (str: string) =>
      //   str.toLowerCase().replace(/^\w/, (char) => char.toUpperCase());

      // Bind Popup
      // const countyName = feature.properties.COUNTY_ID
      //   ? formattedCountyName(feature.properties.CountyName)
      //   : feature.properties.NAME_1;

      // layer.bindPopup(`<b>${countyName}</b>`);
      //
      // // Click event to toggle color
      // layer.on("click", () => {
      //   setSelectedCounties((prev) => {
      //     const newSet = new Set(prev);
      //     if (newSet.has(countyId as number)) {
      //       newSet.delete(countyId as number);
      //     } else {
      //       newSet.add(countyId as number);
      //     }
      //     return newSet;
      //   });
      // });
    }
  };

  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countyName: "",
    },
  });

  // Define form handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    let guess = values.countyName.toLowerCase();

    // handle LD having different naming conventions
    const derryVersions = [
      "derry",
      "londonderry",
      "london-derry",
      "slash city",
      "london derry",
    ];
    if (derryVersions.includes(guess)) guess = "derry - londonderry";

    if (!countyData) return;

    // Get County name and ID
    const findCounty = countyData.features.map((feature) => ({
      countyName:
        feature.properties.CountyName?.toLowerCase() ||
        feature.properties.NAME_1?.toLowerCase(),
      countyId: feature.properties.COUNTY_ID || feature.properties.GID_1,
    }));

    console.log({
      countyData: countyData,
      findCounty: findCounty,
    });

    // Check if guess matches a county name
    const matchedCounty = findCounty.find(
      (county) => county.countyName === guess.toLowerCase(),
    );

    // On match, use unique county id to add to set
    if (matchedCounty) {
      setSelectedCounties((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(matchedCounty.countyId as number)) {
          newSet.delete(matchedCounty.countyId as number);
        } else {
          newSet.add(matchedCounty.countyId as number);
        }
        return newSet;
      });
      setNoCountyFound(false);
    } else {
      setNoCountyFound(true)
      console.log("County not found");
    }

    // clear form on submit
    form.reset()
  }

  return (
    // Set the container width and height to be used by map container
    <div
      style={{ width: "100vw", height: "100vh" }}
      className="flex items-center justify-center"
    >
      <div className="w-1/2 max-w-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="m-4 space-y-2"
          >
            <FormField
              control={form.control}
              name="countyName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter a county name"
                      className="w-fit my-3 px-12 text-left"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-gray-400">{
                    noCountyFound && (
                          "Not found, try again."
                      )
                  }</FormMessage>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-fit text-xs">
              Guess
            </Button>
          </form>
        </Form>
      </div>

      {/* Set map container, */}
      <MapContainer
        center={position}
        zoom={7}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
        maxBounds={irelandBounds}
        maxBoundsViscosity={1.0}
      >
        {/* Include attribution license */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png"
        />

        {/* Set GeoJson tile information */}
        {countyData && (
          <GeoJSON
            data={countyData}
            style={(feature) => ({
              color: borderColor,
              weight: 2,
              opacity: 1,
              fillColor: selectedCounties.has(
                feature?.properties?.COUNTY_ID || feature?.properties?.GID_1,
              )
                ? selectedFillColor
                : defaultFillColor,
              fillOpacity: 0.5,
            })}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}
