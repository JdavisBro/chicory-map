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

import {
  Animals,
  ExtraSaveKeys,
  Gift,
  Gifts,
  Levels,
  Litter,
  OatsGifts,
  OneLitter,
} from "./data/data";
import { useState } from "react";
import Control from "react-leaflet-custom-control";
import { useLocalStorage } from "usehooks-ts";

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

function getOatsClothes(collected: string[]) {
  return (
    "From Oats: " +
    Object.keys(OatsGifts)
      .filter((collId) => !collected.includes(collId))
      .map((collId) => OatsGifts[collId])
      .join(", ")
  );
}

function FilterMarkers({
  obj,
  layer,
  collected,
  toggleCollected,
  markerIcon,
}: {
  obj: Record<string, { name?: string; screen: string; x: number; y: number }>;
  layer: number;
  collected: string[];
  toggleCollected: (collId: string) => void;
  markerIcon:
    | string
    | ((collectable: { screen: string; x: number; y: number }) => string);
}) {
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
          className: collected.includes(collId)
            ? "collected-marker"
            : undefined,
        })}
      >
        <Popup offset={[0, -18]}>
          {obj[collId].name ? (
            <>
              {obj[collId].name}
              <br />
            </>
          ) : collId == "oats" ? (
            <>
              {getOatsClothes(collected)}
              <br />
            </>
          ) : (
            ""
          )}
          <a href="javascript:void" onClick={() => toggleCollected(collId)}>
            {collected.includes(collId) ? "Unm" : "M"}ark as Collected
          </a>
        </Popup>
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
  collected,
  toggleCollected,
}: {
  collectable: Collectable;
  layer: number;
  setLayer: (layer: number) => void;
  collected: string[];
  toggleCollected: (collId: string) => void;
}) {
  const map = useMap();
  const obj = CollectableMap[collectable];
  if (!obj) {
    return null;
  }
  return Object.keys(obj)
    .sort(
      (collId1, collId2) =>
        Number(collected.includes(collId1)) -
        Number(collected.includes(collId2)),
    )
    .map((collId) => (
      <span
        key={collId}
        className={
          collected.includes(collId) ? "collectable-item-collected" : ""
        }
      >
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
          {obj[collId].name ||
            (collId == "oats" ? getOatsClothes(collected) : collId)}
        </a>
        <a
          href="javascript:void"
          className="collectable-item-collect"
          onClick={() => toggleCollected(collId)}
        >
          {collected.includes(collId) ? "Uncollect" : "Collect"}
        </a>
      </span>
    ));
}

export default function App() {
  const [collected, setCollected] = useLocalStorage<string[]>(
    "mapCollected",
    [],
  );
  const setSaveFile = (newCollected: string[]) => {
    if (
      !Object.keys(OatsGifts).some((collId) => !newCollected.includes(collId))
    ) {
      newCollected.push("oats");
    }
  };

  const toggleCollected = (collId: string) =>
    setCollected((collected) =>
      collected.includes(collId)
        ? collected.filter((arrCollId) => arrCollId != collId)
        : [collId, ...collected],
    );

  const [quality, setQuality] = useLocalStorage("mapQuality", "384x216");

  const [collectable, setCollectable] = useState(Collectable.None);
  const toggleCollectable = (type: Collectable) =>
    setCollectable(collectable == type ? Collectable.None : type);

  const [layer, setLayer] = useState(0);

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
              key={mappedLayer}
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
            <LayerGroup>
              <FilterMarkers
                obj={Litter}
                layer={layer}
                collected={collected}
                toggleCollected={toggleCollected}
                markerIcon={(litter: OneLitter) =>
                  litter.npc ? "markers/litterNPC.png" : "markers/litter.png"
                }
              />
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Gifts" checked={true}>
            <LayerGroup>
              <FilterMarkers
                obj={Gifts}
                layer={layer}
                collected={collected}
                toggleCollected={toggleCollected}
                markerIcon={(gift: Partial<Gift>) =>
                  gift.oats
                    ? "markers/giftsOats.png"
                    : gift.npc
                      ? "markers/giftsNPC.png"
                      : gift.treasure
                        ? "markers/giftsTreasure.png"
                        : "markers/gifts.png"
                }
              />
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Animals" checked={true}>
            <LayerGroup>
              <FilterMarkers
                obj={Animals}
                layer={layer}
                collected={collected}
                toggleCollected={toggleCollected}
                markerIcon={"markers/animal.png"}
              />
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <Control position="topright">
          <a className="control-popup control-popup-monochrome">✨</a>
          <section className="control-content">
            {QUALITIES.map((qual) => (
              <label key={qual}>
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
        <Control position="topright">
          <a className="control-popup control-popup-monochrome">⚙️</a>
          <section className="control-content">
            <label>
              <div className="file-input-button">Load Save File</div>
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(event) => {
                  if (!event.target.files) {
                    return;
                  }
                  const file = event.target.files[0];
                  file.text().then((text) => {
                    console.log(
                      Object.keys(JSON.parse(text.split("\n")[3])),
                      Object.keys(JSON.parse(text.split("\n")[3])).filter(
                        (key) =>
                          key.startsWith("found_") || key.startsWith("gift_"),
                      ),
                    );
                    setSaveFile(
                      Object.keys(JSON.parse(text.split("\n")[3])).filter(
                        (key) =>
                          key.startsWith("found_") ||
                          key.startsWith("gift_") ||
                          ExtraSaveKeys.includes(key),
                      ),
                    );
                  });
                }}
              />
            </label>
            <br />
            Windows
            <pre>%LOCALAPPDATA%\paintdog\save\_playdata</pre>
            Mac
            <pre>
              ~/Library/Application
              Support/com.greglobanov.chicory/save/_playdata
            </pre>
            <button onClick={() => setCollected([])}>Reset Collected</button>
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
              collected={collected}
              toggleCollected={toggleCollected}
            />
          </div>
        </Control>
      </MapContainer>
    </>
  );
}
