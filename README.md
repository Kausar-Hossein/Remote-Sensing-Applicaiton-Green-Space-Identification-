Mapping Urban Green Space in Dhaka Using Sentinel-2 and EVI

This Google Earth Engine JavaScript workflow estimates vegetation cover within a user-supplied Dhaka boundary using Sentinel-2 imagery and the Enhanced Vegetation Index (EVI).

It creates a cloud-masked median composite, identifies pixels with **EVI ≥ 0.35**, and estimates their area in hectares and percentage of the valid observation area.

The resulting map is a threshold-based vegetation estimate. It does not distinguish public parks, private gardens, farmland, or other vegetation types.

## Overview

| Setting | Value |
|---|---|
| Platform | Google Earth Engine |
| Language | JavaScript |
| Study area | User-supplied Dhaka boundary |
| Satellite input | Sentinel-2 imagery with an SCL band |
| Calendar year | 2022 |
| Day-of-year filter | 150–240, inclusive |
| Composite | Median of masked observations |
| Vegetation index | Enhanced Vegetation Index |
| Vegetation threshold | EVI ≥ 0.35 |
| Requested area-reduction scale | 10 metres |
| Area units | Hectares |

**Season note:** In 2022, days 150–240 correspond to **30 May–28 August**. The code comment calls this the dry season, but that description should be corrected: this period broadly overlaps Dhaka's monsoon season.

## Required Inputs

The supplied snippet references two objects that must be defined before running it:

- `Dhaka`: the region-of-interest geometry.
- `s2`: a Sentinel-2 ImageCollection containing the `B2`, `B4`, `B8`, `B11`, and `SCL` bands.

A compatible collection is Sentinel-2 Level-2A Surface Reflectance Harmonized:

```javascript
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
```

Use your own boundary asset, replacing the placeholder asset path:

```javascript
var Dhaka = ee.FeatureCollection(
  'projects/YOUR_PROJECT/assets/YOUR_DHAKA_BOUNDARY'
).geometry();

Map.centerObject(Dhaka, 10);
```

Alternatively, draw a boundary in the Earth Engine Code Editor and name the imported geometry `Dhaka`.

The original snippet does not specify an image-collection ID or include the boundary. The collection above is a compatible setup example, not confirmation of the dataset used to produce any previous results.

## Method

### 1. Filter Satellite Imagery

Images are filtered by the Dhaka boundary, the year 2022, and days 150–240. Earth Engine date filters use an exclusive end date, while the day-of-year filter includes its endpoints.

### 2. Apply the Cloud Mask

The function uses Sentinel-2's Scene Classification Layer (`SCL`). It excludes:

| SCL value | Classification |
|---|---|
| 3 | Cloud shadows |
| 7 | Unclassified / low-probability cloud category |
| 8 | Medium-probability cloud |
| 9 | High-probability cloud |
| 10 | Thin cirrus |

Other SCL categories are not explicitly removed by this function. Cloud and shadow masking may leave residual contamination.

### 3. Create a Median Composite

The script calculates the median of the masked observations, divides the image values by `10000`, and clips the composite to the study area.

This scaling converts the Sentinel-2 optical reflectance bands to the range used by the EVI formula. The division also affects other bands retained in the composite; those scaled non-reflectance bands are not used in the EVI calculation.

The composite is displayed with:

```javascript
bands: ['B8', 'B11', 'B2']
```

### 4. Calculate EVI

```text
EVI = 2.5 × (NIR − RED) / (NIR + 6 × RED − 7.5 × BLUE + 1)
```

| Variable | Sentinel-2 band |
|---|---|
| NIR | B8 |
| RED | B4 |
| BLUE | B2 |

### 5. Identify Vegetation

Pixels meeting the selected threshold are retained:

```javascript
var green = evi.gte(0.35).selfMask();
```

The threshold is an analysis choice and should be evaluated against local reference data before treating the map as a validated urban green-space inventory.

### 6. Estimate Area

Pixel area is converted from square metres to hectares:

```javascript
var areaPixel = ee.Image.pixelArea().divide(10000);
```

The script reports:

- Valid EVI observation area within the boundary, labelled `Total Area (ha)` in the code.
- Area of pixels meeting the EVI threshold.
- Thresholded vegetation area as a percentage of valid EVI area.

```text
Green percentage = Green pixel area / Valid EVI area × 100
```

**The denominator is not necessarily the full administrative area of Dhaka.** Pixels without valid EVI observations are excluded. A separate boundary-area calculation is needed if the objective is to report vegetation as a percentage of the complete boundary area.

## How to Run

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/) using an account and Cloud project with Earth Engine access.
2. Create a new JavaScript script and paste your analysis code.
3. Define `s2` using a compatible Sentinel-2 surface-reflectance collection.
4. Import or draw the study boundary and define its geometry as `Dhaka`.
5. Review the day-of-year filter and the EVI threshold.
6. Click **Run**.
7. Enable the composite, EVI, and urban green-space layers in the **Layers** panel. All three are initially switched off in the supplied code.
8. Inspect the area estimates in the **Console**.

## Outputs

| Output | Location |
|---|---|
| Sentinel-2 Composite | Map layer |
| EVI | Map layer |
| Urban Green Space | Map layer |
| Total Area (ha) | Console; valid EVI area |
| Urban Green Space Area (ha) | Console |
| Percentage of Green Area | Console |

The supplied code does **not** include GeoTIFF, CSV, or other export tasks.

## Limitations

- The boundary and original `s2` collection definition are not included in the snippet. They are necessary to reproduce results.
- EVI identifies vegetation signals; it does not establish accessibility, ownership, ecological quality, or land-use category.
- A single threshold can include cropland and exclude sparse or stressed vegetation.
- A seasonal median composite can hide short-term changes and uses different valid observations at different pixels.
- The cloud mask does not explicitly remove all unsuitable SCL categories.
- The green percentage excludes pixels without valid EVI observations and may therefore differ from a full-boundary percentage.
- Area reducers request a 10-metre scale but use `bestEffort: true`, which can increase the computation scale. Record the reduction settings when comparing results.
- For reproducible area accounting, explicitly review the reduction projection and resolution, and consider using a consistent grid without automatic coarsening.
- The code has not been executed here against the user's Earth Engine inputs. No numerical area estimates or validation accuracy are claimed.

## Suggested Repository Structure

```text
Dhaka-Urban-Green-Space-EVI/
├── README.md
├── dhaka_green_space_evi.js
├── data/
│   └── dhaka_boundary.geojson
└── figures/
    ├── sentinel2_composite.png
    ├── evi_map.png
    └── green_space_map.png
```

The boundary and figures are files to add if available and shareable; they are not generated by the supplied snippet. Sentinel-2 images are loaded from Earth Engine and do not need to be uploaded to GitHub.

## References

- [Sentinel-2 Surface Reflectance Harmonized dataset](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- [Earth Engine day-of-year filter](https://developers.google.com/earth-engine/apidocs/ee-filter-dayofyear)
- [Earth Engine Code Editor](https://developers.google.com/earth-engine/guides/playground)

## Author

**Md. Kausar Hossein**

[GitHub](https://github.com/Kausar-Hossein)
GEE Code Link> https://code.earthengine.google.com/8dc183e43a643f02f8a93bfcb9a3829e
