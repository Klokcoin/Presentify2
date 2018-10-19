// This should be related to Data/Document, as a Document can not exist without it's files,
// but for now it is just random utils oops

export let Dataurl = {
  from_file: async (file) => {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      // TODO Errors?
      fr.readAsDataURL(file);
    });
  },
};

export let Bloburl = {
  from_dataurl: async (dataurl) => {
    let response = await fetch(dataurl);
    let blob = await response.blob();
    return blob;
  },
};

export let get_image_info = async (url) => {
  return new Promise((resolve, reject) => {
    var img = new Image();

    img.onload = () => {
      resolve({
        url: url,
        width: img.width,
        height: img.height,
        image: img,
      });
    };
    // TODO Errors?
    img.src = url;
  });
};

export let Dimensions = {
  contain: ({ dimensions, bounds }) => {
    let scale = Math.max(dimensions.width / bounds.width, dimensions.height / bounds.height);
    return {
      width: dimensions.width / scale,
      height: dimensions.height / scale,
    };
  },
};
