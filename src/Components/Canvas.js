import React, { Component } from "react";
import { mapValues, clamp } from "lodash";

import { IsolateCoordinatesForElement } from "./IsolateCoordinatesForElement.js";
import { Transformation2DMatrix } from "../Data/TransformationMatrix.js";

const isWhole = (number) => number % 1 === 0;

let ZoomContext = React.createContext({ scale: 1 });

export let Unzoom = ({ children, ...props }) => {
  if (typeof children === "function") {
    return (
      <ZoomContext.Consumer
        children={({ scale }) =>
          children({ scale, ...mapValues(props, (x) => scale * x) })
        }
      />
    );
  } else {
    return (
      <ZoomContext.Consumer>
        {({ scale }) => (
          <div style={{ transform: `scale(${scale})` }} children={children} />
        )}
      </ZoomContext.Consumer>
    );
  }
};

class Canvas extends Component {
  static defaultProps = {
    maxTranslation: {
      // I don't yet see a reason to limit this...
      x: Infinity,
      y: Infinity,
    },
    // Took these from sketch
    // https://sketchapp.com/docs/canvas/#zooming
    minZoom: 0.01,
    maxZoom: 256,
    initialTranslation: {
      x: 0,
      y: 0,
    },
  };

  state = {
    transform: new Transformation2DMatrix(),
  };

  isolateRef = null;

  doTranslation = ({ deltaX, deltaY }) => {
    this.props.onTransformChange(({ transform }) => {
      const { maxTranslation: max, initialTranslation } = this.props;
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
          x: [-max.x, max.x],
          y: [-max.y, max.y],
        });

      return {
        transform: new_transform,
      };
    });
  };

  doZoom = ({ clientX, clientY, deltaY }) => {
    this.props.onTransformChange(({ transform, zoom }) => {
      const {
        maxZoom,
        minZoom,
        maxTranslation,
        initialTranslation,
      } = this.props;
      let initial_transform = new Transformation2DMatrix({
        e: -initialTranslation.x,
        f: -initialTranslation.y,
      });

      const scale = 1 - (1 / 110) * deltaY;

      let { top, left } = this.measureRef.getBoundingClientRect();
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

  onWheel = (event) => {
    event.preventDefault();
    const { deltaX, deltaY } = event;
    const { doTranslation, doZoom } = this;

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
  };

  render() {
    const {
      onBackgroundClick,
      children,
      initialTranslation,
      transform,
    } = this.props;

    let initial_transform = new Transformation2DMatrix({
      e: -initialTranslation.x,
      f: -initialTranslation.y,
    });

    let invert = initial_transform.multiply(transform.inverse());

    return (
      <ZoomContext.Provider value={{ scale: invert.getScale().x }}>
        <div
          style={{
            overflow: "hidden",
            height: "100%",
            width: "100%",
          }}
          ref={(ref) => (this.measureRef = ref)}
          onWheel={this.onWheel}
          onMouseDown={(e) => {
            // Only reset selected_item if the click is **only** on the canvas,
            // and not actually on one of the divs inside
            if (e.target === e.currentTarget) {
              onBackgroundClick();
            }
          }}
        >
          <div
            ref={(ref) => (this.isolateRef = ref)}
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
              element={this.isolateRef}
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
                width: this.props.maxTranslation.x * 2,
                height: this.props.maxTranslation.y * 2,
              }}
            />

            {/* Render canvas items or whatever */}
            {children}
          </div>
        </div>
      </ZoomContext.Provider>
    );
  }
}

export default Canvas;
