import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import {
  ImageOverlay,
  LayerGroup,
  LayersControl,
  MapContainer,
} from "react-leaflet";

import { Levels } from "./data/data";
import { useState } from "react";
import Control from "react-leaflet-custom-control";

const SCREEN_SIZE = { x: 192, y: 108 };

const QUALITIES = ["192x108", "384x216", "960x540", "1920x1080"];
const QUALITY_SIZES: Record<string, string> = {
  "192x108": "7 MB",
  "384x216": "21 MB",
  "960x540": "85 MB",
  "1920x1080": "223 MB",
};

export default function App() {
  const [quality, setQuality] = useState("384x216");
  console.log(quality);

  return (
    <>
      <MapContainer
        className="map"
        center={[0, 0]}
        zoom={0}
        maxZoom={5}
        minZoom={-10}
        zoomSnap={0}
        zoomAnimation={false}
        crs={L.CRS.Simple}
      >
        <LayersControl>
          {Object.keys(Levels).map((layer) => (
            <LayersControl.BaseLayer
              checked={Number(layer) == 0}
              name={Number(layer) == 0 ? "Surface" : `Layer ${layer}`}
            >
              <LayerGroup>
                {Levels[layer].map((xy) => (
                  <ImageOverlay
                    key={xy.join("_")}
                    url={`screens/${quality}/${layer}_${xy.join("_")}.png`}
                    bounds={
                      new L.LatLngBounds(
                        [-SCREEN_SIZE.y * xy[1], SCREEN_SIZE.x * xy[0]],
                        [
                          -SCREEN_SIZE.y * (xy[1] + 1),
                          SCREEN_SIZE.x * (xy[0] + 1),
                        ],
                      )
                    }
                  />
                ))}
              </LayerGroup>
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>
        <Control position="topright">
          <a className="control-popup">✨</a>
          <section className="control-content">
            {QUALITIES.map((qual) => (
              <label>
                <span>
                  <input
                    type="radio"
                    checked={qual == quality}
                    onChange={() => setQuality(qual)}
                  />
                  {qual} ({QUALITY_SIZES[qual]})
                </span>
              </label>
            ))}
          </section>
        </Control>
      </MapContainer>
    </>
  );
}
