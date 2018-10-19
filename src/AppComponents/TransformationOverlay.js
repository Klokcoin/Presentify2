// Yes I indended to put the Transformation stuff like the draggable circles
// and the actual transforming wrapper here, but I couldn't bring myself to do it just yet

// For now, I have the CanvasItemOverlay here

import React, { Component } from 'react';
import { Draggable, DraggingCircle, Absolute } from '../Elements';
import { Unzoom } from '../Components/Canvas';
import { memoize } from 'lodash';

let vector = {
  rotate: ([x, y], rotation) => {
    var cos = Math.cos(rotation);
    var sin = Math.sin(rotation);
    return [x * cos - y * sin, x * sin + y * cos];
  },

  to_rotation: ([x, y]) => Math.atan2(y, x),

  add: ([x1, y1], [x2, y2]) => {
    return [x1 + x2, y1 + y2];
  },
};

// let DEFAULT_MOVEMENT_VECTORS = {
//   position: { x: 0, y: 0 },
//   size: { x: 0, y: 0 },
//   rotation:
// }

// This is if you really want to have this work on your crappy
// firefox browser that does not support HD cursors
let get_cursor_direction = (angle, pos) => {
  let new_angle =
    Math.round(vector.to_rotation(vector.rotate(pos, angle)) / Math.PI / 0.25) +
    4;
  return [
    'ew-resize',
    'nwse-resize',
    'ns-resize',
    'nesw-resize',
    'ew-resize',
    'nwse-resize',
    'ns-resize',
    'nesw-resize',
    'ew-resize',
  ][new_angle];
};

// HD moving cursors for real pros
let unwhitespaceify = (str) => str.replace(/( |\n)+/g, ' ').trim();

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

let _render_cursor = ({
  type = 'resize',
  size = 24,
  angle,
  backup
}) => {
  if (CURSORS[type] == null) {
    throw new Error(`Trying to render unknown cursor '${type}'`);
  }

  if (navigator.userAgent.includes('Chrome')) {
    let hires_svg = CURSORS[type]({ angle, size: size * 2 });
    let hires = render_css_url(unwhitespaceify(hires_svg), 'image/svg+xml');
    // let hires = rotation_cursor_uri({ angle, size: size * 2 });

    return unwhitespaceify(`
      -webkit-image-set(
        ${hires} 2x
      ) ${size / 2} ${size / 2},
      ${backup || 'pointer'}
    `);
  } else {
    console.log(`backup:`, backup);
    console.log(`window.devicePixelRatio:`, window.devicePixelRatio)
    // Use lowres only when the device is lowres, or there is no backup (eg. rotate)
    if (backup == null || window.devicePixelRatio < 2) {
      let lowres_svg = CURSORS[type]({ angle, size: size });
      let lowres = render_css_url(unwhitespaceify(lowres_svg), 'image/svg+xml');
      return `${lowres} ${size / 2} ${size / 2}, ${backup || 'pointer'}`
    } else {
      return backup;
    }
  }
};
let render_cursor = memoize(_render_cursor, (obj) => {
  return JSON.stringify({
    ...obj,
    angle: Math.round(obj.angle / (2 * Math.PI) * 32) / 32,
  });
});

export class CanvasItemOverlay extends Component {
  state = {
    movement_state: null,
  };

  render() {
    let { movement_state } = this.state;
    let {
      item,
      selected,
      onSelect,
      onChange,
      // inverseScale,
      children,
    } = this.props;

    let act_like_selected = selected || movement_state != null;

    let with_defaults = {
      y: 0,
      x: 0,
      width: 0,
      height: 0,
      rotation: item.rotation,
      ...movement_state,
    };

    let current_item = {
      y: item.y + with_defaults.y,
      x: item.x + with_defaults.x,
      width: item.width + with_defaults.width,
      height: item.height + with_defaults.height,
      rotation: with_defaults.rotation,
    };

    // Positions:
    // -1,-1 -----  1,-1
    //   |           |
    // -1, 1 -----  1, 1
    // let width_height_movement = (direction, movement_state) => {
    //   let [x, y] = vector.rotate(
    //     [movement_state.x, movement_state.y],
    //     -item.rotation
    //   )
    //   let with_rotation = vector.rotate([x / 2, y / 2], item.rotation)
    //   return {
    //     width: direction[0] * x,
    //     x: with_rotation[0],
    //     height: direction[1] * y,
    //     y: with_rotation[1],
    //   }
    // }

    let width_height_movement = (direction, movement_state, item) => {
      let [x, y] = vector.rotate(
        [movement_state.x, movement_state.y],
        -item.rotation
      );

      if (y * direction[1] + item.height < 1) {
        y = -(item.height - 1) * direction[1];
      }
      if (direction[1] === 0) {
        y = 0;
      }
      if (x * direction[0] + item.width < 1) {
        x = -(item.width - 1) * direction[0];
      }
      if (direction[0] === 0) {
        x = 0;
      }

      let with_rotation = vector.rotate([x / 2, y / 2], item.rotation);

      return {
        width: direction[0] * x,
        x: with_rotation[0],
        height: direction[1] * y,
        y: with_rotation[1],
      };
    };

    return (
      <Absolute
        top={current_item.y}
        left={current_item.x}
        onMouseDown={() => {
          onSelect();
        }}
        style={{
          cursor: movement_state ? 'grabbing' : undefined,
          height: current_item.height,
          width: current_item.width,
          transformOrigin: 'center',
          transform: `
            translateX(-50%)
            translateY(-50%)
            rotate(${current_item.rotation}rad)
            translateZ(${item.z}px)
          `,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
        }}
      >
        <div>{children}</div>
        <Unzoom rotation_button_offset={50}>
          {({ scale, rotation_button_offset }) => (
            <React.Fragment>
              <div
                style={{
                  position: 'absolute',
                  top: Math.min(-8, current_item.height - 24) * scale,
                  left: Math.min(-8, current_item.width - 24) * scale,
                  right: Math.min(-8, current_item.width - 24) * scale,
                  bottom: Math.min(-8, current_item.height - 24) * scale,
                  display: 'grid',
                  // TODO Scale these 16px's with the zoom, to keep them big when everything gets small?
                  gridTemplate: act_like_selected
                    ? `
                      "        ↖        ↑        ↗        " ${16 * scale}px
                      "        ←        🧠       →        " 1fr
                      "        ↙        ↓        ↘        " ${16 * scale}px
                    / ${16 * scale}px  1fr  ${16 * scale}px
                  `
                    : `
                      "🧠" 1fr
                    / 1fr
                  `,
                  border: act_like_selected
                    ? `${1 * scale}px dashed white`
                    : 'none',
                }}
              >
                <Draggable
                  onMove={(movement_state) => {
                    console.log(`${item.id} updated!`);
                    this.setState({ movement_state });
                  }}
                  onMoveEnd={(movement_state) => {
                    onChange({
                      y: item.y + movement_state.y,
                      x: item.x + movement_state.x,
                    });
                    this.setState({
                      movement_state: null,
                    });
                  }}
                  cursor="grabbing"
                  style={{ gridArea: '🧠' }}
                />

                {[
                  {
                    name: '↖',
                    direction: [-1, -1],
                  },
                  {
                    name: '↑',
                    direction: [0, -1],
                  },
                  {
                    name: '↗',
                    direction: [1, -1],
                  },
                  {
                    name: '→',
                    direction: [1, 0],
                  },
                  {
                    name: '↘',
                    direction: [1, 1],
                  },
                  {
                    name: '↓',
                    direction: [0, 1],
                  },
                  {
                    name: '↙',
                    direction: [-1, 1],
                  },
                  {
                    name: '←',
                    direction: [-1, 0],
                  },
                ].map(({ direction, name, cursor }) => (
                  <Draggable
                    key={direction.join(',')}
                    style={{
                      gridArea: name,
                    }}
                    cursor={render_cursor({
                      angle: vector.to_rotation(direction) + item.rotation,
                      backup: get_cursor_direction(item.rotation, direction),
                    })}
                    onMove={(movement_state) => {
                      this.setState({
                        movement_state: width_height_movement(
                          direction,
                          movement_state,
                          item
                        ),
                      });
                    }}
                    onMoveEnd={(movement_state) => {
                      let change = width_height_movement(
                        direction,
                        movement_state,
                        item
                      );
                      onChange({
                        width: item.width + change.width,
                        x: item.x + change.x,
                        height: item.height + change.height,
                        y: item.y + change.y,
                      });
                      this.setState({
                        movement_state: null,
                      });
                    }}
                  />
                ))}
              </div>

              {act_like_selected && (
                <Draggable
                  cursor={render_cursor({
                    type: 'rotate',
                    angle: current_item.rotation,
                  })}
                  onMove={(movement_state) => {
                    let current_to_start_vector = [
                      -movement_state.x,
                      -movement_state.y,
                    ];
                    let start_to_center_vector = vector.rotate(
                      [0, item.height / 2 + rotation_button_offset],
                      item.rotation
                    );

                    let straight_angle = 1 / 2 * Math.PI;
                    this.setState({
                      movement_state: {
                        rotation:
                          vector.to_rotation(
                            vector.add(
                              current_to_start_vector,
                              start_to_center_vector
                            )
                          ) - straight_angle,
                      },
                    });
                  }}
                  onMoveEnd={(movement_state) => {
                    let current_to_start_vector = [
                      -movement_state.x,
                      -movement_state.y,
                    ];
                    let start_to_center_vector = vector.rotate(
                      [0, item.height / 2 + rotation_button_offset],
                      item.rotation
                    );

                    let straight_angle = 1 / 2 * Math.PI;
                    onChange({
                      rotation:
                        vector.to_rotation(
                          vector.add(
                            current_to_start_vector,
                            start_to_center_vector
                          )
                        ) - straight_angle,
                    });
                    this.setState({
                      movement_state: null,
                    });
                  }}
                >
                  <Absolute
                    right="50%"
                    top={-rotation_button_offset}
                    style={{ transform: `translateX(50%)` }}
                  >
                    <Unzoom>
                      <DraggingCircle />
                    </Unzoom>
                  </Absolute>
                </Draggable>
              )}
            </React.Fragment>
          )}
        </Unzoom>
      </Absolute>
    );
  }
}
