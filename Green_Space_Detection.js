// Define the Region of Interest (ROI)
// var roi = /* Your region of interest geometry, e.g., a drawn polygon or imported shapefile

// Generate Sentinel-2 composite imagery for the ROI
var image = s2.filterBounds(Dhaka).filterDate('2022-01-01', '2022-12-31')
  .filter(ee.Filter.dayOfYear(150, 240)) // Filter only in dry season
  .map(cloudMask) // Apply cloud masking
  .median()
  .divide(10000) // Scale to 0 - 1
  .clip(Dhaka);

// Display the composite image for the ROI
Map.addLayer(image, { min: [0.05, 0.035, 0], max: [0.5, 0.35, 0.2], bands: ['B8', 'B11', 'B2'] }, 'Sentinel-2 Composite', false);

// Band map for EVI calculation
var bandMap = { NIR: image.select('B8'), RED: image.select('B4'), BLUE: image.select('B2') };

// Calculate Enhanced Vegetation Index (EVI)
var evi = image.expression('(2.5 * (NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1)', bandMap);

// Display EVI layer
Map.addLayer(evi, { min: -0.5, max: 0.5, palette: ['red', 'yellow', 'green'] }, 'EVI', false);

// Define urban green space based on EVI threshold
var green = evi.gte(0.35).selfMask();
Map.addLayer(green, { palette: 'green' }, 'Urban Green Space', false);

// Area pixel calculation in hectares
var areaPixel = ee.Image.pixelArea().divide(10000);

// Calculate total area of ROI
var area = ee.Number(evi.mask().multiply(areaPixel).rename('area').reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: Dhaka,
  scale: 10,
  bestEffort: true
}).get('area'));

// Calculate urban green space area within ROI
var areaGreen = ee.Number(green.multiply(areaPixel).rename('area').reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: Dhaka,
  scale: 10,
  bestEffort: true
}).get('area'));

// Calculate the percentage of green area
var percentGreen = areaGreen.divide(area).multiply(100);

// Print area details
print('Total Area (ha): ', area);
print('Urban Green Space Area (ha): ', areaGreen);
print('Percentage of Green Area: ', percentGreen);

// Cloud masking function
function cloudMask(image) {
  var scl = image.select('SCL');
  var mask = scl.eq(3).or(scl.gte(7).and(scl.lte(10))).eq(0);
  return image.updateMask(mask);
}
