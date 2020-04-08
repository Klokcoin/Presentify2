import React, { Component, useState } from "react";
import { Draggable, DraggingCircle, Absolute } from "../Elements";
import { Unzoom } from "../Components/Canvas";
import { memoize } from "lodash";

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

let width_height_movement = (direction, movement_state, item) => {
  let [x, y] = vector.rotate(
    [movement_state.x, movement_state.y],
    -item.rotation
  );

  if (y * direction[1] + item.height < minimum.height) {
    y = -(item.height - minimum.height) * direction[1];
  }
  if (direction[1] === 0) {
    y = 0;
  }
  if (x * direction[0] + item.width < minimum.width) {
    x = -(item.width - minimum.width) * direction[0];
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

export const CanvasItemOverlay = ({
  item,
  selected,
  onSelect,
  onChange,
  children,
}) => {
  const [movement_state, set_movement_state] = useState(null);

  let act_like_selected = selected || movement_state != null;

  let { transform } = item;

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

  return (
    <Absolute
      top={current_item.y}
      left={current_item.x}
      onMouseDown={() => {
        onSelect();
      }}
      style={{
        cursor: movement_state ? "grabbing" : undefined,
        height: current_item.height,
        width: current_item.width,
        transformOrigin: "center",
        transform: `
          translateX(-50%)
          translateY(-50%)
          rotate(${current_item.rotation}rad)
          translateZ(${item.z || 0}px)
        `,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
      }}
    >
      <div>{children}</div>
      <Unzoom rotation_button_offset={50}>
        {({ scale, rotation_button_offset }) => (
          <>
            <div
              style={{
                position: "absolute",
                top: Math.min(-8, current_item.height - 24) * scale,
                left: Math.min(-8, current_item.width - 24) * scale,
                right: Math.min(-8, current_item.width - 24) * scale,
                bottom: Math.min(-8, current_item.height - 24) * scale,
                display: "grid",
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
                  : "none",
              }}
            >
              <Draggable
                onMove={(movement_state) => {
                  console.log(`${item.id} updated!`);
                  set_movement_state(movement_state);
                }}
                onMoveEnd={(movement_state) => {
                  onChange({
                    y: item.y + movement_state.y,
                    x: item.x + movement_state.x,
                  });
                  set_movement_state(null);
                }}
                cursor="grabbing"
                style={{ gridArea: "🧠" }}
              />

              {[
                {
                  name: "↖",
                  direction: [-1, -1],
                },
                {
                  name: "↑",
                  direction: [0, -1],
                },
                {
                  name: "↗",
                  direction: [1, -1],
                },
                {
                  name: "→",
                  direction: [1, 0],
                },
                {
                  name: "↘",
                  direction: [1, 1],
                },
                {
                  name: "↓",
                  direction: [0, 1],
                },
                {
                  name: "↙",
                  direction: [-1, 1],
                },
                {
                  name: "←",
                  direction: [-1, 0],
                },
              ].map(({ direction, name }) => (
                <Draggable
                  key={direction.join(",")}
                  style={{ gridArea: name }}
                  onMove={(movement_state) => {
                    set_movement_state(
                      width_height_movement(direction, movement_state, item)
                    );
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
                    set_movement_state(null);
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
                    [0, item.height / 2 + rotation_button_offset],
                    item.rotation
                  );

                  let straight_angle = (1 / 2) * Math.PI;
                  set_movement_state({
                    rotation:
                      vector.to_rotation(
                        vector.add(
                          current_to_start_vector,
                          start_to_center_vector
                        )
                      ) - straight_angle,
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

                  let straight_angle = (1 / 2) * Math.PI;
                  onChange({
                    rotation:
                      vector.to_rotation(
                        vector.add(
                          current_to_start_vector,
                          start_to_center_vector
                        )
                      ) - straight_angle,
                  });
                  set_movement_state({
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
          </>
        )}
      </Unzoom>
    </Absolute>
  );
};
