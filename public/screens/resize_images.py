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
  0: Image.new("L", layerSizes[0]),
  1: Image.new("L", layerSizes[1]),
  2: Image.new("L", layerSizes[2]),
}

def scaleList(list, scale):
  return [int(i*scale) for i in list]

print("Creating Stiched Images")
for i in dir.iterdir():
  print(i.stem)
  layer, x, y = [int(n) for n in i.stem.split("_")] 
  if layer > 2: continue
  im = Image.open(i)
  im.convert("L").save(f"1920x1080_lossless/{i.stem}.webp", lossless=True, quality=100)
  # layerIms[layer].paste(im.convert("L"), (layerCenters[layer][0]+x*1920, layerCenters[layer][1]+y*1080))

exit()
print("Resizing and Cropping")
for scale in scales:
  size = (int(1920 * scale), int(1080 * scale))
  print("Scale", scale, size)
  layers = {k: im.resize(scaleList(im.size, scale), resampling) for k, im in layerIms.items()}
  out = Path("x".join([str(s) for s in size]) + "_webp")
  out_lossy = Path("x".join([str(s) for s in size]) + "_webplossy")
  out.mkdir(exist_ok=True)
  out_lossy.mkdir(exist_ok=True)
  for i in dir.iterdir():
    layer, x, y = [int(n) for n in i.stem.split("_")]
    pos = (int(layerCenters[layer][0]*scale+size[0]*x), int(layerCenters[layer][1]*scale+size[1]*y))
    cropped = layers[layer].crop((pos[0], pos[1], pos[0]+size[0], pos[1]+size[1]))
    cropped.save(out / (i.stem + ".webp"), "webp", lossless=True, quality=100)
    cropped.save(out_lossy / (i.stem + ".webp"), "webp", quality=70)
