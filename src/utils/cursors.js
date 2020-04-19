import { memoize } from "lodash";
import { vector } from "./linear_algebra";

// This is if you really want to have this work on your crappy
// firefox browser that does not support HD cursors
export let get_cursor_direction = (angle, pos) => {
  let new_angle =
    Math.round(vector.to_angle(vector.rotate(pos, angle)) / Math.PI / 0.25) + 4;
  return [
    "ew-resize",
    "nwse-resize",
    "ns-resize",
    "nesw-resize",
    "ew-resize",
    "nwse-resize",
    "ns-resize",
    "nesw-resize",
    "ew-resize",
  ][new_angle];
};

// HD moving cursors for real pros
let unwhitespaceify = (str) => str.replace(/( |\n)+/g, " ").trim();

let CURSORS = {
  resize: ({ angle, size }) => {
    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="${size}px"
        height="${size}px"
        viewBox="0 0 20 20"
        enable-background="new 0 0 20 20"
        xml:space="preserve"
        style="
          transform: rotate(45deg) rotate(${angle}rad);
          transform-origin: center;
        "
      >
        <polygon fill="#FFFFFF" points="11.7,9.1 7.7,13.2 10.5,16 2,16 2,7.5 4.9,10.3 8.9,6.3 10.3,4.9 7.5,2 16,2 16,10.5 13.2,7.7 "/>
        <polygon points="10.7,8.7 6.3,13.2 8.1,15 3,15 3,9.9 4.9,11.8 9.3,7.3 11.8,4.9 9.9,3 15,3 15,8.1 13.2,6.3 "/>
      </svg>
    `;
  },
  rotate: ({ angle, size }) => {
    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="${size}px"
        height="${size}px"
        viewBox="0 0 18 18"
        style="
          transform: rotate(+90deg) rotate(${angle}rad);
          transform-origin: center;
        "
      >
          <defs>
              <path d="M9.38266174,5.25384434 L11.6066562,7.44236235 L11.6066562,1 L5.23168762,1 L7.46693351,3.21193936 C5.82231117,4.84240173 5,6.59209483 5,8.46101864 C5,10.3299424 5.82231117,12.0647102 7.46693351,13.6653218 L5.23168762,15.9220373 L11.6066562,15.9220373 L11.6066562,9.4586646 L9.38266174,11.6901217 C8.35242873,10.8440955 7.83731222,9.76772779 7.83731222,8.46101864 C7.83731222,7.15430948 8.35242873,6.08525138 9.38266174,5.25384434 Z" id="path-1"></path>
          </defs>
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <g id="Path-2">
                  <use fill-opacity="0.800000012" fill="#000000" fill-rule="evenodd" xlink:href="#path-1"></use>
                  <path stroke="#FFFFFF" stroke-width="0.75" d="M11.2316562,6.54722697 L11.2316562,1.375 L6.14377025,1.375 L7.99981793,3.21169498 L7.73094963,3.47824836 C6.15360157,5.04201568 5.375,6.69870459 5.375,8.46101864 C5.375,10.2223359 6.15268646,11.8629622 7.72847843,13.3965854 L7.99958511,13.6604372 L6.13093343,15.5470373 L11.2316562,15.5470373 L11.2316562,10.3661435 L9.40786269,12.1960568 L9.1446742,11.9799267 C8.02819957,11.063079 7.46231222,9.88062245 7.46231222,8.46101864 C7.46231222,7.04051792 8.02903914,5.86434905 9.14715607,4.96201892 L9.40736039,4.75203175 L11.2316562,6.54722697 Z"></path>
              </g>
          </g>
      </svg>
    `;
  },
};

let render_css_url = (text, mime_type) => {
  let url = URL.createObjectURL(
    new Blob([unwhitespaceify(text)], { type: mime_type })
  );
  // let url = `data:image/svg+xml;base64,${btoa(unwhitespaceify(svg))}`;
  return `url(${url})`;
};

let _render_cursor = ({ type = "resize", size = 24, angle, backup }) => {
  if (CURSORS[type] == null) {
    throw new Error(`Trying to render unknown cursor '${type}'`);
  }

  if (navigator.userAgent.includes("Chrome")) {
    let hires_svg = CURSORS[type]({ angle, size: size * 2 });
    let hires = render_css_url(unwhitespaceify(hires_svg), "image/svg+xml");
    // let hires = rotation_cursor_uri({ angle, size: size * 2 });

    return unwhitespaceify(`
      -webkit-image-set(
        ${hires} 2x
      ) ${size / 2} ${size / 2},
      ${backup || "pointer"}
    `);
  } else {
    console.log(`backup:`, backup);
    console.log(`window.devicePixelRatio:`, window.devicePixelRatio);
    // Use lowres only when the device is lowres, or there is no backup (eg. rotate)
    if (backup == null || window.devicePixelRatio < 2) {
      let lowres_svg = CURSORS[type]({ angle, size: size });
      let lowres = render_css_url(unwhitespaceify(lowres_svg), "image/svg+xml");
      return `${lowres} ${size / 2} ${size / 2}, ${backup || "pointer"}`;
    } else {
      return backup;
    }
  }
};

export let render_cursor = memoize(_render_cursor, (obj) => {
  return JSON.stringify({
    ...obj,
    angle: Math.round((obj.angle / (2 * Math.PI)) * 32) / 32,
  });
});
