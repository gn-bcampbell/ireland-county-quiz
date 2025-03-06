import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useTranslation } from "react-i18next";
import ReactConfetti from "react-confetti";

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
  VARNAME_1: string; // Irish County name
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
  const [noCountyFound, setNoCountyFound] = useState<boolean>(false);
  const [guessMessage, setGuessMessage] = useState("");
  const [width, setWidth] = useState(window.innerWidth);
  const [height] = useState(window.innerHeight);
  const [zoomLevel, setZoomLevel] = useState(width < 640 ? 6 : 7);
  const { t, i18n } = useTranslation();
  const [isIrish, setIsIrish] = useState<boolean>(false);
  const [selectedCounties, setSelectedCounties] = useState<Set<number>>(
    () => new Set(JSON.parse(localStorage.getItem("selectedCounties") || "[]")),
  );
  const [correctCounty, setCorrectCounty] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("correctCounty") || "[]"),
  );

  useEffect(() => {
    localStorage.setItem(
      "selectedCounties",
      JSON.stringify([...selectedCounties]),
    );
  }, [selectedCounties]);

  useEffect(() => {
    localStorage.setItem("correctCounty", JSON.stringify(correctCounty));
  }, [correctCounty]);

  const addCounty = (newCounty: string) => {
    setCorrectCounty((prevCounties) => {
      // Only add the newCounty if it doesn't already exist in the array
      if (!prevCounties.includes(newCounty)) {
        return [...prevCounties, newCounty];
      }
      return prevCounties; // return the array as is if the county already exists
    });
  };

  const clearCounties = () => {
    setCorrectCounty([]);
    setSelectedCounties(new Set());
  };

  const borderColor = "rgba(255,255,255,0.89)";
  const defaultFillColor = "#c2c2e8";
  const selectedFillColor = "green";

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection<Geometry, CountyProperties>) => {
        setCountyData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // listener
  useEffect(() => {
    setZoomLevel(width < 640 ? 6 : 7);
  }, [width]);

  interface zoomProps {
    zoomLevel: number;
  }

  // pass as function to MapContainer to manually update zoom level
  function UpdateZoom({ zoomLevel }: zoomProps) {
    const map = useMap();

    useEffect(() => {
      map.setZoom(zoomLevel);
    }, [zoomLevel, map]);

    return null;
  }

  // remove fadas from all strings
  function normalizeString(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

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

    // reset error message
    setGuessMessage("");

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
    type County = {
      countyName: string;
      countyId: string | number;
    };

    let findCounty: County[];
    if (isIrish) {
      findCounty = countyData.features.map((feature) => ({
        countyName:
          feature.properties.CountyName?.toLowerCase() ||
          normalizeString(feature.properties.VARNAME_1?.toLowerCase()),
        countyId: feature.properties.COUNTY_ID || feature.properties.GID_1,
      }));
    } else {
      findCounty = countyData.features.map((feature) => ({
        countyName:
          feature.properties.CountyName?.toLowerCase() ||
          feature.properties.NAME_1?.toLowerCase(),
        countyId: feature.properties.COUNTY_ID || feature.properties.GID_1,
      }));
    }

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
          setGuessMessage(`You've already added: ${values.countyName}`);
        } else {
          newSet.add(matchedCounty.countyId as number);
          addCounty(guess);
        }
        return newSet;
      });
      setNoCountyFound(false);
    } else {
      setNoCountyFound(true);
    }

    // clear form on submit
    form.reset();
  }
  return (
    // Set the container width and height to be used by map container
    <div
      style={{ width: "100vw", height: "100vh" }}
      className="flex flex-col-reverse sm:flex-row items-center justify-center"
    >
      {correctCounty.length === 32 && (
        <ReactConfetti width={width} height={height} />
      )}

      <div className="w-full sm:w-1/2">
        <h1 className="flex justify-center max-w-2/3 mx-auto text-center text-wrap text-xl font-semibold">
          {t("welcomeMessage")}
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-sm mx-auto p-4"
          >
            <FormField
              control={form.control}
              name="countyName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder={t("guessCounty")}
                      className="w-full my-3 text-left"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400 pb-2">
                    {isIrish && (
                      <p className="text-xs text-gray-400 italic">
                        *tacaíocht don síneadh fada atá ag teacht go luath
                      </p>
                    )}
                    {noCountyFound && "Not found, try again."}
                    {guessMessage}
                  </FormMessage>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 justify-around w-full gap-6 z-50">
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button
                    type="button"
                    variant={"destructive"}
                    className="w-full text-xs"
                  >
                    {t("clearList")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("thisWillResetYourProgress")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearCounties}>
                      {t("clearList")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Guess button */}
              <Button type="submit" className="w-full text-xs">
                {t("guess")}
              </Button>
            </div>
          </form>
        </Form>

        <RadioGroup defaultValue="english" className="flex justify-center ">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <RadioGroupItem
                    value="english"
                    id="english"
                    onClick={() => {
                      i18n.changeLanguage("en");
                      setIsIrish(false);
                    }}
                  />
                  <Label htmlFor="english" className="px-2">
                    English
                  </Label>
                </TooltipTrigger>
                <TooltipContent side={"right"} className={"max-w-1/2"}>
                  <p>Guess each county using the English spelling.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <RadioGroupItem
                    value="irish"
                    id="irish"
                    onClick={() => {
                      setIsIrish(true);
                      i18n.changeLanguage("ga");
                    }}
                  />
                  <Label htmlFor="irish" className="px-2">
                    Gaeilge
                  </Label>
                </TooltipTrigger>
                <TooltipContent side={"right"} className={"max-w-1/2"}>
                  <p>
                    Déan buille faoi thuairim go n-úsáideann gach contae an
                    litriú Gaeilge.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </RadioGroup>

        {/* Show correct guesses */}
        <Accordion type="single" className="w-2/3 mx-auto mb-6" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              {t("seeCorrectGuesses")}
              {correctCounty.length === 32 ? (
                <span className={`float-end text-green-600`}>
                  {correctCounty.length} / 32{" "}
                  <span className={"pl-2 text-lg animate-pulse"}>🎉</span>
                </span>
              ) : (
                <span className={`float-end text-gray-400`}>
                  {correctCounty.length} / 32
                </span>
              )}
            </AccordionTrigger>
            {correctCounty.length > 0 && (
              <AccordionContent className="text-sm text-green-700">
                <ul className="flex flex-wrap">
                  {[...new Set(correctCounty)] // Remove duplicates and sort
                    .sort((a, b) => a.localeCompare(b)) // Alphabetical order
                    .map((county) => (
                      <li key={county} className="w-1/3 p-1 border-box">
                        {county.charAt(0).toUpperCase() +
                          county.slice(1).toLowerCase()}
                      </li>
                    ))}
                </ul>
              </AccordionContent>
            )}
          </AccordionItem>
        </Accordion>

        <p className="fixed bottom-0 text-xs p-2 pt-10">
          Created by
          <a
            className="italic text-purple-500 px-1 hover:underline-offset-2 hover:underline"
            href="https://www.brendancampbell.dev"
            target="_blank"
          >
            Brendan Campbell
          </a>
          I hope you like it!
        </p>
      </div>

      {/* Set map container */}
      <div className="w-full sm:w-1/2 h-full z-10">
        <MapContainer
          center={position}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
          maxBounds={irelandBounds}
          maxBoundsViscosity={1.0}
        >
          <UpdateZoom zoomLevel={zoomLevel} />

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
    </div>
  );
}
