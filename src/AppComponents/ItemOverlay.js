import React, { useState, useContext } from "react";
import { PresentifyContext } from "../PresentifyContext";
import { Absolute, Draggable, DraggingCircle } from "../Elements";
import { getScale, vector } from "../utils/linear_algebra";
import { render_cursor, get_cursor_direction } from "../utils/cursors";
import { ItemPreviewContext } from "../Data/ItemPreviewContext.js";

export let ItemOverlay = ({ item, children }) => {
  const { sheet_view, select_item, change_item } = useContext(
    PresentifyContext
  );
  let { preview } = React.useContext(ItemPreviewContext);
  return (
    <ItemOverlayWithoutContext
      item={item}
      children={children}
      sheet_view={sheet_view}
      select_item={select_item}
      change_item={change_item}
      preview_movement_state={
        preview?.id === item.id ? preview.movement_state : null
      }
    />
  );
};

export let MemoItemOverlay = ({ item, children }) => {
  const { sheet_view, select_item, change_item } = useContext(
    PresentifyContext
  );
  let { preview } = React.useContext(ItemPreviewContext);

  return React.useMemo(
    () => (
      <ItemOverlayWithoutContext
        item={item}
        children={children}
        sheet_view={sheet_view}
        select_item={select_item}
        change_item={change_item}
        preview_movement_state={
          preview?.id === item.id ? preview.movement_state : null
        }
      />
    ),
    [
      getScale(sheet_view.transform),
      sheet_view.selected_id,
      item,
      preview && preview.id === item.id && preview.movement_state,
    ]
  );
};

const ItemOverlayWithoutContext = ({
  children,
  item,
  sheet_view: { transform, selected_id },
  select_item,
  change_item,
  preview_movement_state,
}) => {
  let movement_state = preview_movement_state;
  console.log(`preview_movement_state:`, preview_movement_state);
  let set_movement_state = () => {};

  let selected = selected_id === item.id;
  let act_like_selected = selected || movement_state != null;

  let with_defaults = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: item.rotation,
    ...movement_state,
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
        select_item(item.id);
      }}
      left={current_item.x}
      top={current_item.y}
      style={{
        cursor: movement_state ? "grabbing" : undefined,
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
      }}
    >
      {children}
    </Absolute>
  );
};
