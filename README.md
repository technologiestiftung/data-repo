# data-repo
Basic site generator for a data repository.

## Setup

Create .env with your AWS bucketUrl, bucket, region, key and id.

```
npm install
npm run dev
```

*Tipp:* In order to overcome CORS problems for the geojson visualisations, the script copies the geojson files from the S3 into the static site. During development this makes everything a bit slow. Simply comment out lines 87-110 in source/_data/dataset.js. This will disable all maps, but everything else will work fine.

## Overview

### source/assets

Static files like images, CSS, etc.
Those files are coppied to _site/assets, based on the .eleventy.json
```
eleventyConfig.addPassthroughCopy("source/assets", "assets");
```

### source/_data/site.js

Basic configs for the site, like baseUrl, etc.
baseUrl is the most important, for local development set this to your localhost setup, for deployment, this needs to be set to the final url (https://data.odis-berlin.de). TODO: Check if there is a way to switch between the two automatically without need of changing them manually.
It also contains an array of formatters, which translate abbreviations from the meta.json's into more readable form.

### source/archive/

This folder contains data that is no longer up to date, but must remain available, e.g. because it is linked in blogposts. They have to be inserted there manually. The data is stored in an extra archive folder in the S3 folder, which is not taken in the build process (see next paragraph).


### source/_data/dataset.js

This is where the magic happens. The script reads out the S3 folder and creates a data object for each folder, which is turned into a dataset page. Each folder holds a meta.json, which holds the data to create the pages.

### source/_includes/layouts

- dataset.liquid: individual pages for each dataset
- dcat.liquid: metadata json files for each dataset
- default.liquid: base template for the html files (head, header, footer)
- geojson.liquid: output of downloaded geojson files
- startpage.liquid: list pages

### source

- 404.liquid: 404
- dataset-geojson.liquid: output of downloaded geojson files
- dataset-meta.liquid: metadata json files for each dataset
- dataset-page.liquid: individual pages for each dataset
- index.liquid: list pages (index.html, /en/index.html, /de/index.html)

