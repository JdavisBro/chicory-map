from pathlib import Path

from PIL import Image

resampling = Image.Resampling.BICUBIC

layerSizes = [
   [30720, 43200],
   [34560, 33480],
   [32640, 18360],
]
layerCenters = {
  0: [13440, 27000],
  1: [13440, 23760],
  2: [13440, 10800],
}

scales = [
  0.5,
  0.2,
  0.1
]
dir = Path("1920x1080/")

layerIms = {
  0: Image.new("RGB", layerSizes[0]),
  1: Image.new("RGB", layerSizes[1]),
  2: Image.new("RGB", layerSizes[2]),
}

def scaleList(list, scale):
  return [int(i*scale) for i in list]

print("Creating Stiched Images")
for i in dir.iterdir():
  print(i)
  layer, x, y = [int(n) for n in i.stem.split("_")] 
  if layer > 2: continue
  im = Image.open(i)
  layerIms[layer].paste(im, (layerCenters[layer][0]+x*1920, layerCenters[layer][1]+y*1080))

print("Resizing and Cropping")
for scale in scales:
  size = (int(1920 * scale), int(1080 * scale))
  print("Scale", scale, size)
  layers = {k: im.resize(scaleList(im.size, scale), resampling) for k, im in layerIms.items()}
  out = Path("x".join([str(s) for s in size]))
  out.mkdir(exist_ok=True)
  for i in dir.iterdir():
    layer, x, y = [int(n) for n in i.stem.split("_")]
    pos = (int(layerCenters[layer][0]*scale+size[0]*x), int(layerCenters[layer][1]*scale+size[1]*y))
    layers[layer].crop((pos[0], pos[1], pos[0]+size[0], pos[1]+size[1])).save(out / i.name)
    

