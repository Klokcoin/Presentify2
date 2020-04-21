import React, { useContext, useRef, useEffect } from "react";
import { isEqual } from "lodash";
import { PresentifyContext } from "../PresentifyContext";
import { MemoItemOverlay as ItemOverlay } from "../AppComponents/ItemOverlay";
import { component_map } from "../PresentifyComponents";
import {
  translation_matrix,
  scale_matrix,
  toString,
  multiply,
  getScale,
  inverse,
  apply,
} from "../utils/linear_algebra";
import styled, { useTheme } from "styled-components/macro";
import { IsolateCoordinatesForElement } from "./IsolateCoordinatesForElement";
import { BasictransformationLayer } from "../Layers/BasictransformationLayer.js";
import { Absolute, Draggable } from "../Elements";

const CELL_SIZE = 100;
const LINE_THICKNESS = 3;
const WORLD = {
  width: 500 * 2,
  height: 500 * 2,
};

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

const Background = styled.div`
  background: ${({ theme }) => theme.canvas.backgroundColor};
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  height: 100%;
  width: 100%;
`;

const Origin = styled.div`
  transform: translate(-50%, -50%);
  width: ${LINE_THICKNESS}px;
  height: ${LINE_THICKNESS}px;
  background: hsl(30, 91%, 67%);
`;

const ReferenceGrid = ({ onClick }) => {
  const theme = useTheme();
  const color = theme.canvas.gridColor;
  return (
    <div
      onMouseDown={onClick}
      style={{
        height: WORLD.height + LINE_THICKNESS - 0.5,
        width: WORLD.width + LINE_THICKNESS - 0.5,
        transform: "translate(-50%, -50%)",
        background: `repeating-linear-gradient(
          90deg,
          ${color},
          ${color} ${LINE_THICKNESS}px,
          transparent ${LINE_THICKNESS}px,
          transparent ${CELL_SIZE}px
        ),
        repeating-linear-gradient(
          0deg,
          ${color},
          ${color} ${LINE_THICKNESS}px,
          transparent ${LINE_THICKNESS}px,
          transparent ${CELL_SIZE}px
        )`,
      }}
    />
  );
};

let RecursiveMap = (items) => {
  return items.map((item) => {
    let component_info = component_map[item.type];
    let Item = component_info.Component;

    if (item.type === "group") {
      let group = item;

      //recursive case
      return (
        <ItemOverlay item={group} key={item.id}>
          <PresentifyContext.Consumer>
            {(presentify_context) => (
              <PresentifyContext.Provider
                value={{
                  ...presentify_context,
                  change_item: (child_id, change) => {
                    let index = group.groupItems.findIndex(
                      (x) => x.id === child_id
                    );
                    if (index !== -1) {
                      let newGroupItems = [...group.groupItems];
                      newGroupItems[index] = {
                        ...newGroupItems[index],
                        ...change,
                      };

                      presentify_context.change_item(group.id, {
                        groupItems: newGroupItems,
                      });
                    }
                  },
                }}
              >
                {RecursiveMap(group.groupItems)}
              </PresentifyContext.Provider>
            )}
          </PresentifyContext.Consumer>
        </ItemOverlay>
      );
    }
    //base case
    else
      return (
        <ItemOverlay item={item} key={item.id}>
          <Item options={item.options || {}} />
        </ItemOverlay>
      );
  });
};

export const options = {
  minZoom: 0.15,
  maxZoom: 9900, // I feel like beyond this pixel calculations start being imprecise :/
  minTranslation: {
    x: -WORLD.width / 2, // NOT ACTUALLY IMPLEMENTED RIGHT NOW!
    y: -WORLD.height / 2, // ^
  },
  maxTranslation: {
    x: WORLD.width / 2, // ^
    y: WORLD.height / 2, // ^
  },
};

const Canvas = ({ children, items, bounds: { top, left, width, height } }) => {
  let [selection, setSelection] = React.useState(null);

  const {
    sheet_view: { transform, selected_ids },
    select_items,
    set_sheet_view,
  } = useContext(PresentifyContext);
  const measureRef = useRef(null);

  // Translate our "absolute" origin by the width of the SideBar (for mouse events only, canvas already sits next to it)
  let page_to_canvas = translation_matrix([left, top]);
  // Translate the grid such that its origin (its top-left) is at the center of the screen
  let origin_to_center = translation_matrix([width / 2, height / 2]);

  const mouse_to_grid = ([clientX, clientY]) => {
    // First inverse the move from the "absolute" origin to the canvas: now our mouse will treat the top-left of the canvas as (0, 0)
    let click_inside_canvas = apply(inverse(page_to_canvas), [
      clientX,
      clientY,
    ]);

    /*
      NOTE: matrix multiplication works from right to left: the right (bottom, if vertically formatted) transforms are applied FIRST!
      If you look at our Components below, you will see the transformations on:
        `Grid`: multiply(origin_to_center, grid_to_origin, transform)
        `Inner`: inverse(grid_to_origin) -> b/c this happens first, we must also inverse it first
      So the total transforms applied are (in CORRECT order): inverse(grid_to_origin), transform, grid_to_origin, origin_to_center
      We inverse this complete transformation to get the click_inside_grid
    */
    let click_inside_grid = apply(
      inverse(multiply(origin_to_center, transform)),
      click_inside_canvas
    );

    return click_inside_grid;
  };

  // We can't attach the listener on the Background like `onWheel={onWheel}` b/c it needs to know its size first... (I think)
  useEffect(() => {
    if (measureRef.current == null) {
      return;
    }

    // NOTE: we are fixing this react event up using IsolateCoordinatesForElement, so the coords are already relative to the grid!
    const onWheel = (event) => {
      event.preventDefault();

      if (event.ctrlKey) {
        let { clientX, clientY, deltaY } = event;
        zoom({ clientX, clientY, deltaY });
      } else {
        let { deltaX, deltaY } = event;
        translate({ deltaX, deltaY });
      }
    };

    let listener = ["wheel", onWheel, { capture: true, passive: false }];

    measureRef.current.addEventListener(...listener);
    let oldRef = measureRef.current;

    return function cleanup() {
      oldRef.removeEventListener(...listener);
    };
  }, [measureRef.current]);

  const translate = ({ deltaX, deltaY }) => {
    let scale = getScale(transform);
    // "Normalize" the distance by which we have translated
    let [relativeDeltaX, relativeDeltaY] = apply(
      inverse(scale_matrix([scale, scale])),
      [deltaX, deltaY]
    );

    set_sheet_view(({ transform, ...sheet_view }) => {
      let new_transform = multiply(
        transform,
        translation_matrix([-relativeDeltaX, -relativeDeltaY])
      );
      return { ...sheet_view, transform: new_transform };
    });
  };

  const zoom = ({ clientX, clientY, deltaY }) => {
    const ZOOM_SPEED_MULTIPLIER = 1;
    const MAX_ZOOM_SPEED = 0.25;
    let speed = Math.min(
      MAX_ZOOM_SPEED,
      Math.abs((ZOOM_SPEED_MULTIPLIER * deltaY) / 128)
    );
    let zoom = 1 - Math.sign(deltaY) * speed;
    let new_scale = getScale(transform) * zoom;

    if (new_scale > options.maxZoom || new_scale < options.minZoom) {
      zoom = 1;
    }

    // First translate the center of our zoom to the origin (by [-clientX, -clientY] that is)
    // translate the grid back to its original origin (top-left), scale, and inverse the previous two operations again
    let zoom_matrix = multiply(
      inverse(translation_matrix([-clientX, -clientY])),
      scale_matrix([zoom, zoom]),
      translation_matrix([-clientX, -clientY])
    );

    set_sheet_view(({ transform, ...sheet_view }) => {
      let new_transform = multiply(transform, zoom_matrix);
      return { ...sheet_view, transform: new_transform };
    });
  };

  // NOTE that this also triggers when starting the drag on canvas!
  const on_canvas_click = ({ target, currentTarget, ...event }) => {
    // Only deselect item if the click is **only** on the canvas, and not actually on one of the divs inside
    if (target === currentTarget) {
      select_items([]);
    }
  };

  const on_canvas_drag_start = ({ absolute_x, absolute_y }) => {
    setSelection({
      start: { x: absolute_x, y: absolute_y },
      end: { x: absolute_x, y: absolute_y },
    });
  };

  const on_canvas_drag = ({ absolute_x, absolute_y }) => {
    let new_selection = { ...selection, end: { x: absolute_x, y: absolute_y } };
    setSelection(new_selection);

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

  let full_transform = multiply(origin_to_center, transform); // the right transformation happens first!

  return (
    <Draggable
      onMoveStart={on_canvas_drag_start}
      onMove={on_canvas_drag}
      onMoveEnd={on_canvas_drag_end}
    >
      <Background
        ref={measureRef}
        onMouseDown={on_canvas_click}
        onScroll={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
      >
        {/* Michiel dit is echt geniaal */}
        {/* Thanks :D - DRAL */}
        <IsolateCoordinatesForElement
          element={measureRef.current}
          mapCoords={({ x, y }) => {
            let coords_in_grid = mouse_to_grid([x, y]);
            return {
              x: coords_in_grid[0],
              y: coords_in_grid[1],
            };
          }}
        />
        <div
          onMouseDown={on_canvas_click}
          style={{
            transform: `${toString(full_transform)}`,
            transformOrigin: "0 0",
          }}
        >
          <ReferenceGrid onClick={on_canvas_click} />

          {/* Put a little orange rectangle at the origin for reference */}
          <Absolute left={0} top={0}>
            <Origin />
          </Absolute>

          {selection && (
            <Absolute
              left={Math.min(selection.start.x, selection.end.x)}
              top={Math.min(selection.start.y, selection.end.y)}
            >
              <SelectionArea
                style={{
                  width: Math.abs(selection.start.x - selection.end.x),
                  height: Math.abs(selection.start.y - selection.end.y),
                }}
              />
            </Absolute>
          )}

          {RecursiveMap(items)}
        </div>

        <BasictransformationLayer transform={full_transform} />
      </Background>
    </Draggable>
  );
};

export default Canvas;
