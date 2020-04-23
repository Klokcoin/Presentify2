import React, { useState } from "react";
import styled from "styled-components/macro";
import { isEqual } from "lodash";
import { Absolute, Event } from "../Elements";
import { PresentifyContext } from "../PresentifyContext";
import { useContext } from "react";

const item_is_in_selection = (item, selection) => {
  let item_bounds = {
    left: item.x - item.width / 2,
    right: item.x + item.width / 2,
    top: item.y + item.height / 2,
    bottom: item.y - item.height / 2,
  };

  let selection_bounds = {
    left: Math.min(selection.start.x, selection.end.x),
    right: Math.max(selection.start.x, selection.end.x),
    top: Math.max(selection.start.y, selection.end.y),
    bottom: Math.min(selection.start.y, selection.end.y),
  };

  return (
    item_bounds.left >= selection_bounds.left &&
    item_bounds.right <= selection_bounds.right &&
    item_bounds.top <= selection_bounds.top &&
    item_bounds.bottom >= selection_bounds.bottom
  );
};

const SelectionArea = styled.div`
  background: rgba(24, 160, 251, 0.1);
  border: 0.7px solid rgba(24, 160, 251, 0.5);
`;

const SelectionOverlay = ({ canvas }) => {
  let [selection, setSelection] = useState(null);
  const {
    sheet_view: { selected_ids },
    sheet: { items },
    select_items,
  } = useContext(PresentifyContext);

  const on_canvas_drag_start = ({ absolute_x, absolute_y }) => {
    select_items([]);

    setSelection({
      start: { x: absolute_x, y: absolute_y },
      end: { x: absolute_x, y: absolute_y },
    });
  };

  const on_canvas_drag = ({ absolute_x, absolute_y }) => {
    let new_selection = { ...selection, end: { x: absolute_x, y: absolute_y } };
    setSelection(new_selection);
    console.log("new_selection", new_selection);

    let new_selected_ids = items
      .filter((item) => item_is_in_selection(item, new_selection))
      .map((item) => item.id);

    if (!isEqual(new_selected_ids, selected_ids)) {
      select_items(new_selected_ids);
    }
  };

  const on_canvas_drag_end = () => {
    setSelection(null);
  };

  return (
    <>
      <Event
        element={canvas}
        capture
        passive
        name="mousedown"
        handler={(event) => {
          if (event.target === event.currentTarget) {
            on_canvas_drag_start({
              absolute_x: event.pageX,
              absolute_y: event.pageY,
            });
          }
        }}
      />
      <Event
        element={canvas}
        capture
        passive
        name="mousemove"
        handler={(event) => {
          if (selection) {
            on_canvas_drag({
              absolute_x: event.pageX,
              absolute_y: event.pageY,
            });
          }
        }}
      />
      <Event
        element={canvas}
        capture
        passive
        name="mouseup"
        handler={(event) => {
          if (selection) {
            on_canvas_drag_end();
          }
        }}
      />
      {selection && (
        <Absolute
          left={Math.min(selection.start.x, selection.end.x)}
          top={Math.min(selection.start.y, selection.end.y)}
          style={{
            width: Math.abs(selection.start.x - selection.end.x),
            height: Math.abs(selection.start.y - selection.end.y),
          }}
        >
          <SelectionArea
            style={{
              width: Math.abs(selection.start.x - selection.end.x),
              height: Math.abs(selection.start.y - selection.end.y),
            }}
          />
        </Absolute>
      )}
    </>
  );
};

export default SelectionOverlay;
