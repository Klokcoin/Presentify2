import React, { Component } from 'react';
import { Draggable, DraggingCircle, Absolute } from './Elements';
import { Unzoom } from './Canvas';

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

let get_cursor_direction = (angle, pos) => {
  let new_angle =
    Math.round(vector.to_rotation(vector.rotate(pos, angle)) / Math.PI / 0.25) +
    4;
  return ['ew', 'nwse', 'ns', 'nesw', 'ew', 'nwse', 'ns', 'nesw', 'ew'][
    new_angle
  ];
};

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
        y = -(item.height - 1) / direction[1];
      }
      if (x * direction[0] + item.width < 1) {
        x = -(item.width - 1) / direction[0];
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
        >
          <Absolute right={0} top={0} left={0} bottom={0}>
            <Unzoom>
              {({ scale }) => (
                <Absolute
                  top={0}
                  right={0}
                  left={0}
                  bottom={0}
                  style={{ margin: -16 * scale, padding: 16 * scale }}
                />
              )}
            </Unzoom>
            {children}
          </Absolute>
        </Draggable>

        {act_like_selected && (
          <React.Fragment>
            <Absolute
              top={-1}
              left={-1}
              right={-1}
              bottom={-1}
              style={{
                pointerEvents: 'none',
                border: act_like_selected
                  ? `1px black dotted`
                  : `1px transparent solid`,
              }}
            />

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

            {[[-1, -1], [-1, 1], [1, 1], [1, -1]].map((pos) => (
              <Draggable
                key={pos.join(',')}
                onMove={(movement_state) => {
                  let next_movement = width_height_movement(
                    pos,
                    movement_state,
                    item
                  );

                  this.setState({
                    movement_state: next_movement,
                  });
                }}
                onMoveEnd={(movement_state) => {
                  let change = width_height_movement(pos, movement_state, item);
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
                // inverseScale={inverseScale}
              >
                <Absolute
                  left={pos[0] === -1 ? -10 : null}
                  right={pos[0] === 1 ? -10 : null}
                  top={pos[1] === -1 ? -10 : null}
                  bottom={pos[1] === 1 ? -10 : null}
                >
                  <Unzoom>
                    <DraggingCircle
                      direction={get_cursor_direction(
                        current_item.rotation,
                        pos
                      )}
                    />
                  </Unzoom>
                </Absolute>
              </Draggable>
            ))}
          </React.Fragment>
        )}
      </Absolute>
    );
  }
}

export default CanvasItem;
