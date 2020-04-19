import React, { useContext, useRef, useEffect } from "react";
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
import styled from "styled-components/macro";
import { IsolateCoordinatesForElement } from "./IsolateCoordinatesForElement";
import { BasictransformationLayer } from "../Layers/BasictransformationLayer.js";
import { Absolute } from "../Elements";

const CELL_SIZE = 100;
const LINE_THICKNESS = 3;
const WORLD = {
  width: 500 * 2,
  height: 500 * 2,
};

const Background = styled.div`
  position: relative;
  background: #ccc;
  overflow: hidden;
  height: 100%;
  width: 100%;
`;

const GRID_COLOR = "hsl(213, 20%, 75%)";
// Our "coordinate system"; the grid background is just for reference (and can totally be removed)
const Grid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: ${WORLD.height + LINE_THICKNESS - 0.5}px;
  width: ${WORLD.width + LINE_THICKNESS - 0.5}px;
  transform: translateX(-50%) translateY(-50%);

  background: repeating-linear-gradient(
      90deg,
      ${GRID_COLOR},
      ${GRID_COLOR} ${LINE_THICKNESS}px,
      transparent ${LINE_THICKNESS}px,
      transparent ${CELL_SIZE}px
    ),
    repeating-linear-gradient(
      0deg,
      ${GRID_COLOR},
      ${GRID_COLOR} ${LINE_THICKNESS}px,
      transparent ${LINE_THICKNESS}px,
      transparent ${CELL_SIZE}px
    );
`;

const Inner = styled.div``;

const Origin = styled.div`
  transform: translate(-50%, -50%);
  width: ${LINE_THICKNESS}px;
  height: ${LINE_THICKNESS}px;
  background: hsl(30, 91%, 67%);
`;

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
  const {
    sheet_view: { transform },
    select_item,
    set_sheet_view,
  } = useContext(PresentifyContext);
  const measureRef = useRef(null);

  // Translate our "absolute" origin by the width of the SideBar (for mouse events only, canvas already sits next to it)
  let page_to_canvas = translation_matrix([left, top]);
  // Translate the grid such that its origin is now at its center, no longer its top-left!
  let grid_to_origin = translation_matrix([
    -WORLD.width / 2 - 1.3, // these small factors make the grid align with the center
    -WORLD.height / 2 - 1, // don't really know why they have to be here TODO: find this out
  ]);
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
      inverse(
        multiply(
          origin_to_center,
          grid_to_origin,
          transform,
          inverse(grid_to_origin)
        )
      ),
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
      inverse(grid_to_origin),
      scale_matrix([zoom, zoom]),
      grid_to_origin,
      translation_matrix([-clientX, -clientY])
    );

    set_sheet_view(({ transform, ...sheet_view }) => {
      let new_transform = multiply(transform, zoom_matrix);
      return { ...sheet_view, transform: new_transform };
    });
  };

  const on_canvas_click = ({ target, currentTarget }) => {
    // Only deselect item if the click is **only** on the canvas, and not actually on one of the divs inside
    if (target === currentTarget) {
      select_item(null);
    }
  };

  let full_transform = multiply(
    origin_to_center,
    grid_to_origin,
    transform,
    inverse(grid_to_origin)
  ); // the right transformation happens first!

  return (
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
      {/* Grid is our "coordinate system" (with gridlines as a background for reference) */}
      <div
        onMouseDown={on_canvas_click}
        style={{
          transform: `${toString(multiply(full_transform))}`,
          transformOrigin: "0 0",
        }}
      >
        <Grid />

        {/* Put a little orange rectangle at the origin for reference */}
        <Absolute left={0} top={0}>
          <Origin />
        </Absolute>

        {RecursiveMap(items)}
      </div>

      <BasictransformationLayer transform={full_transform} />
    </Background>
  );
};

export default Canvas;
