const config = require("../../config.json");

const fetch = require("node-fetch");

const AWS = require("aws-sdk");
AWS.config.update({region: config.aws.region});

const s3 = new AWS.S3({
  accessKeyId : config.aws.id,
  secretAccessKey : config.aws.key
});

const getDatasets = () => {
  // get all the folders in root
  return s3.listObjectsV2({ Bucket: config.aws.bucket, Delimiter: "/" }).promise()
    .then((objects) => {
      return Promise.all(objects.CommonPrefixes.map((obj) => {
        // get all objects in the folder
        return s3.listObjectsV2({ Bucket: config.aws.bucket, Delimiter: "/", Prefix: obj.Prefix }).promise()
          .then((dataItems) => {
            const dataset = {
              folder: obj.Prefix,
              meta: false,
              hasPreview: false,
              hasThumb: false,
              hasGeojson: false,
              geojson: '',
              formats: []
            };

            dataItems.Contents.forEach((dataItem) => {
              switch(dataItem.Key.split("/")[1]) {
                // yay meta file
                case "meta.json":
                  dataset.meta = true;
                  break;
                // wohooo preview image
                case "preview.jpg":
                  dataset.hasPreview = true;
                  break;
                // horray thumbnail for the list
                case "thumb.jpg":
                  dataset.hasThumb = true;
                  break;
                // the rest should be datafiles
                default:
                  // the folder itself also shows up here (Size === 0)
                  if (dataItem.Size > 0) {
                    dataset.formats.push({
                      file: dataItem.Key,
                      size: dataItem.Size,
                      format: dataItem.Key.split("/")[1].split(".")[1]
                    });
                    if (dataItem.Key.indexOf(".geojson") >= 0 && dataItem.Key.indexOf("zip") == -1) {
                      dataset.hasGeojson = dataItem.Key;
                    }
                  }
                  break;
              }
            });

            // if there is a meta file get it an merge into data set, otherwise return null
            if (dataset.meta) {
              const url = config.aws.bucketUrl + obj.Prefix + "meta.json";
              return fetch(url)
                .then((response) => {
                  if (response.ok) {
                    return response.json();
                  } else {
                    throw Error(`Error fetching ${url}`)
                  }
                })
                .then((json) => {
                  dataset.meta = {
                    meta: json
                  };
                  return dataset;
                });
            } else {
              return Promise.resolve(null);
            }
          })
      }));
    })
    // download geojsons to overcome CORS
    // comment this whole promise block out for quicker building
    // .then((objects) => {
    //   return Promise.all(objects.map((object, id) => {
    //     if (object.hasGeojson) {
    //       const url = config.aws.bucketUrl + object.hasGeojson;
    //       return fetch(url)
    //         .then((response) => {
    //           if (response.ok) {
    //             return response.json();
    //           } else {
    //             throw Error(`Error fetching ${url}`)
    //           }
    //         })
    //         .then((json) => {
    //           objects[id].geojson = JSON.stringify(json);
    //           return Promise.resolve();
    //         }); 
    //     } else {
    //       return Promise.resolve();
    //     }
    //   }))
    //   .then(() => {
    //     return objects;
    //   });
    // })
    .then((objects) => {
      const pageList = [];
      objects.filter((obj) => obj !== null)
      .forEach((obj) => {
        (["de", "en"]).forEach((lang) => {
          const page = JSON.parse(JSON.stringify(obj));
          page.lang = lang;
          page.title = page.meta.meta[lang].title;
          page.description = page.meta.meta[lang].description;
          page.keywords = page.meta.meta[lang].keywords;
          pageList.push(page);
        });
      });
      return pageList;
    })
    .catch((err) => {
      throw err;
    });
};

module.exports = async function () {
  try {
    const response = await getDatasets();
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
