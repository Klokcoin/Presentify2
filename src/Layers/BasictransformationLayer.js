import React from "react";

import { Layer } from "../Elements.js";
import { PresentifyContext, find_in_group } from "../PresentifyContext.js";
import { ItemPreviewContext } from "../Data/ItemPreviewContext.js";
import { Absolute, Draggable, DraggingCircle } from "../Elements";
import { getScale, vector } from "../utils/linear_algebra";
import { render_cursor, get_cursor_direction } from "../utils/cursors";

import * as Algebra from "../utils/linear_algebra";
import { useTheme } from "styled-components";

const SmallSelectionOverlay = ({ item }) => {
  let current_item = item;
  return (
    <Absolute
      // onMouseDown={(event) => {
      //   event.stopPropagation();
      //   select_items([item.id]);
      // }}
      left={current_item.x}
      top={current_item.y}
      style={{
        // cursor: preview ? "grabbing" : undefined,
        height: Math.abs(current_item.height), // We allow for negative height and width (so we can figure out if reflection has happened),
        width: Math.abs(current_item.width), // but CSS can only render positive width, height, so we Math.abs them here
        transform: `
        translate(-50%, -50%)
        rotate(${current_item.rotation}rad)
        translateZ(${item.z || 0}px)
      `,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        outline: `${1}px dashed black`,
        outlineOffset: 6 + 2 * 1,
      }}
    />
  );
};

const ItemOverlay = ({ item }) => {
  const {
    sheet_view: { transform, selected_ids },
    select_items,
    change_item,
  } = React.useContext(PresentifyContext);
  const theme = useTheme();

  let { preview, set_preview } = React.useContext(ItemPreviewContext);
  let set_movement_state = (movement_state) => {
    if (movement_state == null) {
      set_preview(null);
    } else {
      set_preview({ id: item.id, movement_state: movement_state });
    }
  };

  let selected = selected_ids.includes(item.id);
  let act_like_selected = selected || preview != null;

  let with_defaults = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: item.rotation,
    ...preview?.movement_state,
  };

  let current_item = {
    x: item.x + with_defaults.x,
    y: item.y + with_defaults.y,
    width: item.width + with_defaults.width,
    height: item.height + with_defaults.height,
    rotation: with_defaults.rotation,
  };

  let scale = getScale(transform);
  let OFFSET = 8 + (1 / scale) * 24;
  let ROTATION_BUTTON_OFFSET = 2 * OFFSET;

  // Whether we have reflected along the x or y axes
  let should_flip = {
    x: current_item.width < 0,
    y: current_item.height < 0,
  };

  const do_rotation = (movement_state) => {
    // If we reflected our y axes (height < 0), our rotation_button will also be reflected & appear half a turn (180deg, Math.Pi) away
    let current_to_start_vector = [-movement_state.x, -movement_state.y];

    // If it's flipped, the vector from start_to_center should also have its sign flipped
    let distance_to_center = Math.abs(item.height) / 2 + ROTATION_BUTTON_OFFSET;
    let start_to_center_vector = vector.rotate(
      [0, (should_flip.y ? -1 : 1) * distance_to_center],
      item.rotation
    );

    // If it's flipped, add the angle instead of subtract it (see https://developer.mozilla.org/en-US/docs/Web/CSS/angle)
    let straight_angle = (should_flip.y ? -1 : 1) * (1 / 2) * Math.PI;

    let rotation =
      vector.to_angle(
        vector.add(current_to_start_vector, start_to_center_vector)
      ) - straight_angle;

    return rotation;
  };

  const do_resize = (direction, movement_state) => {
    // First, undo the items rotation
    let [x, y] = vector.rotate(
      [movement_state.x, movement_state.y],
      -item.rotation
    );

    // Multiply all directions we ain't moving in by 0, else just by 1
    [x, y] = vector.multiply(
      direction.map((n) => (n === -1 ? 1 : n)),
      [x, y]
    );

    let [width, height] = vector.multiply(direction, [x, y]);

    [x, y] = vector.rotate([x, y], item.rotation);

    return {
      x: x / 2,
      y: y / 2,
      width: width,
      height: height,
    };
  };

  return (
    <Absolute
      onMouseDown={(event) => {
        event.stopPropagation();
        select_items([item.id]);
      }}
      left={current_item.x}
      top={current_item.y}
      style={{
        cursor: preview ? "grabbing" : undefined,
        height: Math.abs(current_item.height), // We allow for negative height and width (so we can figure out if reflection has happened),
        width: Math.abs(current_item.width), // but CSS can only render positive width, height, so we Math.abs them here
        transform: `
          translate(-50%, -50%)
          rotate(${current_item.rotation}rad)
          translateZ(${item.z || 0}px)
          scaleX(${should_flip.x ? -1 : 1})
          scaleY(${should_flip.y ? -1 : 1})
        `,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        outline: act_like_selected
          ? `${1 + (2 * (1 / scale)) / 3}px dashed ${
              theme.canvas.selectionColor
            }`
          : "none",
        outlineOffset: 6 + 2 * (1 / scale),
      }}
    >
      {/* Selection overlay with drag and resize areas: 🧠 is for grabbing, ↖↑↗ ←→↙↓↘ for resizing */}
      <Absolute
        top={-OFFSET}
        left={-OFFSET}
        right={-OFFSET}
        bottom={-OFFSET}
        style={{
          display: "grid",
          gridTemplate: act_like_selected
            ? `
                "        ↖        ↑        ↗        " minmax(0, ${OFFSET}px)
                "        ←        🧠       →        " minmax(33%, 1fr)
                "        ↙        ↓        ↘        " minmax(0, ${OFFSET}px)
              / minmax(0, ${OFFSET}px)  minmax(33%, 1fr)  minmax(0, ${OFFSET}px)
            ` // At max, the edge rows/columns will be exactly ${OFFSET}px large, and at min 33% (so you can better drag small elements)
            : `
                "🧠" 1fr
              / 1fr
            `,
          // Made this and outline such that it can be offset to be inside the element (so that we can already drag while hovering over the outline)
          // outline: act_like_selected
          //   ? `${1 + 2 * (1 / scale)/3}px dashed ${theme.canvas.selectionColor}`
          //   : "none",
          // outlineOffset: `-${3 + 2 * (1 / scale)}px`,
        }}
      >
        {/* Grab area, here we can drag the element & move it */}
        <Draggable
          onMove={(movement_state) => {
            set_movement_state(movement_state);
          }}
          onMoveEnd={(movement_state) => {
            change_item(item.id, {
              y: item.y + movement_state.y,
              x: item.x + movement_state.x,
            });
            set_movement_state(null);
          }}
          cursor="grabbing"
          style={{ gridArea: "🧠" }}
        />
        {/* Resize area */}
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
        ].map(({ name, direction }) => (
          <Draggable
            key={direction.join(",")}
            style={{ gridArea: name }}
            cursor={render_cursor({
              angle:
                vector.to_angle(
                  // The direction on the grid gets correctly flipped by scaleX & scaleY, but our cursor doesn't yet "know" it
                  vector.multiply(direction, [
                    should_flip.x ? -1 : 1,
                    should_flip.y ? -1 : 1,
                  ])
                ) + item.rotation,
              backup: get_cursor_direction(
                item.rotation,
                // Same as above TODO: actually test this!
                vector.multiply(direction, [
                  should_flip.x ? -1 : 1,
                  should_flip.y ? -1 : 1,
                ])
              ),
            })}
            onMove={(movement_state) => {
              let change = do_resize(direction, movement_state);
              set_movement_state(change);
            }}
            onMoveEnd={(movement_state) => {
              let change = do_resize(direction, movement_state);
              change_item(item.id, {
                x: item.x + change.x,
                y: item.y + change.y,
                width: item.width + change.width,
                height: item.height + change.height,
              });
              set_movement_state(null);
            }}
          />
        ))}
      </Absolute>

      {/* Rotation button */}
      {act_like_selected && (
        <Draggable
          cursor={render_cursor({
            type: "rotate",
            angle: current_item.rotation + (should_flip.y ? Math.PI : 0),
          })}
          onMove={(movement_state) => {
            let rotation = do_rotation(movement_state);
            set_movement_state({ rotation });
          }}
          onMoveEnd={(movement_state) => {
            let rotation = do_rotation(movement_state);
            change_item(item.id, { rotation });
            set_movement_state(null);
          }}
        >
          <Absolute
            top={-ROTATION_BUTTON_OFFSET}
            right={"50%"}
            style={{ transform: `scale(${1 / scale}, ${1 / scale})` }}
          >
            <DraggingCircle size={10} />
          </Absolute>
        </Draggable>
      )}
    </Absolute>
  );
};

export let BasictransformationLayer = ({ transform }) => {
  const { sheet_view, sheet, change_item } = React.useContext(
    PresentifyContext
  );

  let items = sheet_view.selected_ids
    .map((id) => find_in_group(sheet.items, id))
    .filter((x) => Boolean(x));

  if (items.length === 0) {
    return <Layer style={{ pointerEvents: "none" }} />;
  }

  if (items.length === 1) {
    let [item] = items;
    return (
      <Layer style={{ pointerEvents: "none" }}>
        <div
          style={{
            pointerEvents: "all",
            transform: Algebra.toString(transform),
            transformOrigin: "0 0",
          }}
        >
          <ItemOverlay item={item} />
        </div>
      </Layer>
    );
  }
  return (
    <Layer style={{ pointerEvents: "none" }}>
      <div
        style={{
          pointerEvents: "all",
          transform: Algebra.toString(transform),
          transformOrigin: "0 0",
        }}
      >
        {items.map((item) => (
          <SmallSelectionOverlay item={item} />
        ))}
      </div>
    </Layer>
  );
};
