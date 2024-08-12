import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import {
  ImageOverlay,
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { Animals, Gift, Gifts, Levels, Litter, OneLitter } from "./data/data";
import { useState } from "react";
import Control from "react-leaflet-custom-control";

const SCALE = 0.1;
const SCREEN_SIZE = { x: 1929 * SCALE, y: 1080 * SCALE };

const QUALITIES = ["192x108", "384x216", "960x540", "1920x1080"];
const QUALITY_SIZES: Record<string, string> = {
  "192x108": "7 MB",
  "384x216": "21 MB",
  "960x540": "85 MB",
  "1920x1080": "223 MB",
};

enum Collectable {
  None,
  Litter,
  Gift,
  Animal,
}

function getPosition(screen: string, x: number, y: number) {
  const [scr_x, scr_y] = screen
    .split("_")
    .map((i) => Number(i))
    .slice(1);
  return new L.LatLng(
    -SCREEN_SIZE.y * scr_y - y * SCALE,
    SCREEN_SIZE.x * scr_x + x * SCALE,
  );
}

function filterMarkers(
  obj: Record<string, { name?: string; screen: string; x: number; y: number }>,
  layer: number,
  markerIcon:
    | string
    | ((collectable: { screen: string; x: number; y: number }) => string),
) {
  return Object.keys(obj)
    .filter((collId) => Number(obj[collId].screen[0]) == layer)
    .map((collId) => (
      <Marker
        key={collId}
        position={getPosition(obj[collId].screen, obj[collId].x, obj[collId].y)}
        icon={L.icon({
          iconUrl:
            typeof markerIcon == "string"
              ? markerIcon
              : markerIcon(obj[collId]),
          iconSize: [41, 41],
          iconAnchor: [20, 25],
        })}
      >
        {obj[collId].name ? (
          <Popup offset={[0, -18]}>{obj[collId].name}</Popup>
        ) : null}
      </Marker>
    ));
}

function MapEvents({ setLayer }: { setLayer: (layer: number) => void }) {
  useMapEvents({
    baselayerchange: (event) =>
      setLayer(
        event.name == "Surface" ? 0 : Number(event.name.replace("Layer ", "")),
      ),
  });

  return null;
}

const CollectableMap: Record<
  Collectable,
  | undefined
  | Record<string, { name?: string; screen: string; x: number; y: number }>
> = {
  [Collectable.None]: undefined,
  [Collectable.Litter]: Litter,
  [Collectable.Gift]: Gifts,
  [Collectable.Animal]: Animals,
};

function CollectableList({
  collectable,
  layer,
  setLayer,
}: {
  collectable: Collectable;
  layer: number;
  setLayer: (layer: number) => void;
}) {
  const map = useMap();
  const obj = CollectableMap[collectable];
  if (!obj) {
    return null;
  }
  return Object.keys(obj).map((collId) => (
    <a
      href="javascript:void"
      onClick={() => {
        const coll = obj[collId];
        const newLayer = Number(coll.screen[0]);
        if (layer != newLayer) {
          setLayer(newLayer);
        }
        const pos = getPosition(coll.screen, coll.x, coll.y);
        map.flyTo(pos, Math.max(map.getZoom(), 1));
        setTimeout(
          () =>
            map.eachLayer((mapLayer) => {
              "getLatLng" in mapLayer &&
                (mapLayer.getLatLng as () => L.LatLng)().equals(pos) &&
                mapLayer.openPopup();
            }),
          100,
        );
      }}
    >
      {obj[collId].name ?? collId}
    </a>
  ));
}

export default function App() {
  const [quality, setQuality] = useState("384x216");

  const [collectable, setCollectable] = useState(Collectable.None);
  const toggleCollectable = (type: Collectable) =>
    setCollectable(collectable == type ? Collectable.None : type);

  const [layer, setLayer] = useState(0);

  const litterMarkers = filterMarkers(Litter, layer, (litter: OneLitter) =>
    litter.npc ? "markers/litterNPC.png" : "markers/litter.png",
  );
  const giftMarkers = filterMarkers(Gifts, layer, (gift: Partial<Gift>) =>
    gift.npc
      ? "markers/giftsNPC.png"
      : gift.treasure
        ? "markers/giftsTreasure.png"
        : "markers/gifts.png",
  );
  const animalsMarkers = filterMarkers(Animals, layer, "markers/animal.png");

  return (
    <>
      <MapContainer
        className="map"
        center={[0, 0]}
        zoom={0}
        maxZoom={3}
        minZoom={-2}
        zoomSnap={0}
        zoomAnimation={false}
        crs={L.CRS.Simple}
      >
        <MapEvents setLayer={setLayer} />
        <LayersControl>
          {Object.keys(Levels).map((mappedLayer) => (
            <LayersControl.BaseLayer
              checked={Number(mappedLayer) == layer}
              name={
                Number(mappedLayer) == 0 ? "Surface" : `Layer ${mappedLayer}`
              }
            >
              <LayerGroup>
                {Levels[mappedLayer].map((xy) => (
                  <ImageOverlay
                    key={xy.join("_")}
                    url={`screens/${quality}/${mappedLayer}_${xy.join("_")}.png`}
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
          <LayersControl.Overlay name="Litter" checked={true}>
            <LayerGroup>{litterMarkers}</LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Gifts" checked={true}>
            <LayerGroup>{giftMarkers}</LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Animals" checked={true}>
            <LayerGroup>{animalsMarkers}</LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <Control position="topright">
          <a className="control-popup control-popup-monochrome">✨</a>
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
        <Control position="bottomleft">
          <a
            className={`control-popup control-popup-keep${collectable == Collectable.Litter ? " control-popup-selected" : ""}`}
            onClick={() => toggleCollectable(Collectable.Litter)}
          >
            🗑️
          </a>
        </Control>
        <Control position="bottomleft">
          <a
            className={`control-popup control-popup-keep${collectable == Collectable.Gift ? " control-popup-selected" : ""}`}
            onClick={() => toggleCollectable(Collectable.Gift)}
          >
            🎁
          </a>
        </Control>
        <Control position="bottomleft">
          <a
            className={`control-popup control-popup-keep${collectable == Collectable.Animal ? " control-popup-selected" : ""}`}
            onClick={() => toggleCollectable(Collectable.Animal)}
          >
            🐱
          </a>
        </Control>
        <Control position="bottomleft">
          <div
            className={`collectable-list${collectable == Collectable.None ? " collectable-list-hidden" : ""}`}
          >
            <CollectableList
              collectable={collectable}
              layer={layer}
              setLayer={setLayer}
            />
          </div>
        </Control>
      </MapContainer>
    </>
  );
}
