import React, { Component } from 'react';
import { Draggable, DraggingCircle, Absolute } from './Elements';
import { Unzoom } from './Canvas';
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
let resize_cursor_data_uri = ({ angle, size }) => {
  let svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="${size / 2}px"
      y="${size / 2}px"
      width="${size}px"
      height="${size}px"
      viewBox="0 0 20 20"
      enable-background="new 0 0 20 20"
      xml:space="preserve"
      style="
        transform: rotate(-45deg) rotate(${angle}deg);
        transform-origin: center;
      "
    >
      <polygon fill="#FFFFFF" points="11.7,9.1 7.7,13.2 10.5,16 2,16 2,7.5 4.9,10.3 8.9,6.3 10.3,4.9 7.5,2 16,2 16,10.5 13.2,7.7 "/>
      <polygon points="10.7,8.7 6.3,13.2 8.1,15 3,15 3,9.9 4.9,11.8 9.3,7.3 11.8,4.9 9.9,3 15,3 15,8.1 13.2,6.3 "/>
    </svg>
  `;

  // TODO Blob?
  let url = URL.createObjectURL(new Blob([unwhitespaceify(svg)], {type : 'image/svg+xml'}));
  // let url = `data:image/svg+xml;base64,${btoa(unwhitespaceify(svg))}`;
  return `url(${url})`;
};

let _resize_cursor_svg = ({ angle, size = 24, backup = 'pointer' }) => {
  // TODO We could use this, lowres is really low res though :/
  // let lowres = resize_cursor_data_uri({ angle, size });

  if (navigator.userAgent.includes('Chrome')) {
    let hires = resize_cursor_data_uri({ angle, size: size * 2 });

    return unwhitespaceify(`
      -webkit-image-set(
        ${hires} 2x
      ) ${size / 2} ${size / 2},
      ${backup}
    `);
  } else {
    let lowres = resize_cursor_data_uri({ angle, size: size });
    return `${lowres} ${size / 2} ${size / 2}, ${backup}`;
  }
};
let resize_cursor_svg = memoize(_resize_cursor_svg, (obj) =>
  JSON.stringify(obj)
);

class CanvasItem extends Component {
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
          transform: `translateX(-50%) translateY(-50%) rotate(${
            current_item.rotation
          }rad)`,
          userSelect: 'none',
        }}
      >
        <div>{children}</div>
        <Unzoom>
          {({ scale }) => (
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
                    "        ↖        ↑        ↗     "   ${16 * scale}px
                    "        ←        🧠       →     "   1fr
                    "        ↙        ↓        ↘     "   ${16 * scale}px
                  / ${16 * scale}px  1fr  ${16 * scale}px
                  `
                    : `
                  "🧠" 1fr
                / 1fr
                `,
                  border: act_like_selected ? `${1 * scale}px dashed white` : 'none',
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
                    cursor={resize_cursor_svg({
                      angle: Math.round(
                        (vector.to_rotation(direction) -
                          0.5 * Math.PI +
                          item.rotation) /
                          Math.PI *
                          180
                      ),
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
                  onMove={(movement_state) => {
                    let current_to_start_vector = [
                      -movement_state.x,
                      -movement_state.y,
                    ];
                    let start_to_center_vector = vector.rotate(
                      [0, item.height / 2 + 50],
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
                      [0, item.height / 2 + 50],
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
                    top={-50}
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

export default CanvasItem;
