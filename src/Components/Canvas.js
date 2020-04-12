import React, { createContext, useContext, useRef, useEffect } from "react";
import { mapValues, clamp } from "lodash";

import { IsolateCoordinatesForElement } from "./IsolateCoordinatesForElement.js";
import { Transformation2DMatrix } from "../Data/TransformationMatrix.js";

const isWhole = (number) => number % 1 === 0;

let ZoomContext = createContext({ scale: 1 });

export let Unzoom = ({ children, ...props }) => {
  let { scale } = useContext(ZoomContext);
  if (typeof children === "function") {
    return children({ scale, ...mapValues(props, (x) => scale * x) });
  } else {
    return <div style={{ transform: `scale(${scale})` }} children={children} />;
  }
};

let Canvas = ({
  transform,
  onTransformChange,
  onBackgroundClick,
  children,
  maxZoom = 256, // Took these from sketch
  minZoom = 0.01, // https://sketchapp.com/docs/canvas/#zooming
  maxTranslation = {
    // I don't yet see a reason to limit this...
    x: Infinity,
    y: Infinity,
  },
  initialTranslation = {
    x: 0,
    y: 0,
  },
}) => {
  let isolateRef = useRef(null);
  let measureRef = useRef(null);

  let doTranslation = ({ deltaX, deltaY }) => {
    onTransformChange(({ transform }) => {
      // 'Normalize' the translation speed, we multiply our deltas by the current scale,
      // so we pan slower at close zooms & faster at far zooms
      const {
        x: relativeDeltaX,
        y: relativeDeltaY,
      } = transform.inverseScale().applyToCoords({
        x: deltaX,
        y: deltaY,
      });

      let new_transform = transform
        .multiply(
          new Transformation2DMatrix({
            e: -relativeDeltaX,
            f: -relativeDeltaY,
          })
        )
        .clampTranslation({
          x: [-maxTranslation.x, maxTranslation.x],
          y: [-maxTranslation.y, maxTranslation.y],
        });

      return {
        transform: new_transform,
      };
    });
  };

  let doZoom = ({ clientX, clientY, deltaY }) => {
    onTransformChange(({ transform, zoom }) => {
      let initial_transform = new Transformation2DMatrix({
        e: -initialTranslation.x,
        f: -initialTranslation.y,
      });

      const scale = 1 - (1 / 110) * deltaY;

      let { top, left } = measureRef.current.getBoundingClientRect();
      // NOTE So learnt now, need to apply the initial_transform AFTER the invert... which now
      // .... I think about it.. is quite obvious from the fact that it is reversed
      const click_inside_canvas = transform
        .inverse()
        .multiply(initial_transform)
        .applyToCoords({
          x: clientX - left,
          y: clientY - top,
        });

      let current_zoom = transform.getScale().x;
      let zoom_diff =
        current_zoom / clamp(current_zoom * scale, minZoom, maxZoom);
      let new_transform = transform
        .multiply(
          new Transformation2DMatrix({
            e: click_inside_canvas.x,
            f: click_inside_canvas.y,
          })
        )
        .multiply(
          new Transformation2DMatrix({
            a: 1 / zoom_diff,
            d: 1 / zoom_diff,
          })
        )
        .multiply(
          new Transformation2DMatrix({
            e: -click_inside_canvas.x,
            f: -click_inside_canvas.y,
          })
        );

      // After zoom fix, we check if we happen to go over the translation bounds still
      new_transform = new_transform.clampTranslation({
        x: [-maxTranslation.x, maxTranslation.x],
        y: [-maxTranslation.y, maxTranslation.y],
      });

      return {
        transform: new_transform,
      };
    });
  };

  let initial_transform = new Transformation2DMatrix({
    e: -initialTranslation.x,
    f: -initialTranslation.y,
  });

  let invert = initial_transform.multiply(transform.inverse());

  // This is necessary for the onWheel={() => {}} event, because we can
  useEffect(() => {
    if (measureRef.current == null) {
      return;
    }

    measureRef.current.addEventListener("wheel", (event) => {
      event.preventDefault();
      const { deltaX, deltaY } = event;

      // NOTE It might actually be that this `isWhole` thing makes
      // .... For a more uniform experience for laptops that don't have
      // .... propper touchpads (like we do 👩🏿‍💻 (Yes that is a black women in tech LOOK I AM SO PROGRESSIVE (VIRTUE SIGNALLING +10)))
      // .... So we might have to try that out
      // let is_pinch = !(isWhole(deltaX) && isWhole(deltaY));
      let is_pinch = event.ctrlKey;
      if (event.ctrlKey) {
        doZoom(event);
      } else {
        doTranslation(event);
      }
    });
  }, [measureRef.current]);

  return (
    <ZoomContext.Provider value={{ scale: invert.getScale().x }}>
      <div
        style={{
          overflow: "hidden",
          height: "100%",
          width: "100%",
        }}
        ref={measureRef}
        onMouseDown={(e) => {
          // Only reset selected_item if the click is **only** on the canvas,
          // and not actually on one of the divs inside
          if (e.target === e.currentTarget) {
            onBackgroundClick();
          }
        }}
      >
        <div
          ref={isolateRef}
          style={{
            transform: `
              ${initial_transform.inverse().toString()}
              ${transform.toMatrix3D().toString()}
            `,
            transformStyle: `preserve-3d`,
            transformOrigin: "0% 0%",
          }}
          onMouseDown={(e) => {
            // Only trigger onBackgroundClick if the click is **only** on the canvas,
            // and not actually on one of the divs inside
            if (e.target === e.currentTarget) {
              onBackgroundClick();
            }
          }}
        >
          <IsolateCoordinatesForElement
            element={isolateRef.current}
            // NOTE Ik weet dat je het zo hebt gemaakt dat ik in principe
            // .... mapCoords={invert.applyToCoords}
            // .... kan doen maar dat vind ik hekka onleesbaar(der)
            mapCoords={(coords) => invert.applyToCoords(coords)}
          />

          {/* A gray shape to show the bounds, also just for reference */}
          <div
            style={{
              pointerEvents: "none",
              position: "absolute",
              top: 0,
              left: 0,
              border: "solid 1px white",
              borderRadius: 5,
              transform: `translateX(-50%) translateY(-50%)`,
              width: maxTranslation.x * 2,
              height: maxTranslation.y * 2,
            }}
          />

          {/* Render canvas items or whatever */}
          {children}
        </div>
      </div>
    </ZoomContext.Provider>
  );
};

export default Canvas;
