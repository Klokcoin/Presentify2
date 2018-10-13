import React, { Component } from 'react';
import { mapValues, clamp } from 'lodash';

import { Transformation2DMatrix } from './TransformationMatrix.js';
import { IsolateCoordinatesForElement } from './IsolateCoordinatesForElement.js';

const isWhole = (number) => number % 1 === 0;

let ZoomContext = React.createContext({ scale: 1 });

export let Unzoom = ({ children, ...props }) => {
  if (typeof children === 'function') {
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
      x: 300,
      y: 300,
    },
    minZoom: 0.5,
    maxZoom: 20,
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

      const scale = 1 - 1 / 110 * deltaY;

      // We need to apply the inverse of the current transformation to the mouse coordinates
      // to get the 'actual' click coordinates
      const { x: mouseX, y: mouseY } = transform
        .inverse()
        .multiply(initial_transform)
        .applyToCoords({
          x: clientX,
          y: clientY,
        });

      let new_transform = transform.multiply(
        new Transformation2DMatrix({
          a: scale,
          d: scale,
          e: -mouseX * (scale - 1),
          f: -mouseY * (scale - 1),
        })
      );

      // Check if we are inside the zoom bounds
      let zoom_scale = new_transform.getScale().x;
      let zoom_diff = zoom_scale / clamp(zoom_scale, minZoom, maxZoom);
      if (zoom_diff !== 1) {
        // Out of bounds, but instead of not applying the transformation,
        // apply it as far as we can.
        // NOTE Not sure if I need mouseX or mouseY here but I like it
        // .... (This is also why I can not move this to `matrix.clampScale`)
        new_transform = new_transform.multiply(
          new Transformation2DMatrix({
            a: 1 / zoom_diff,
            d: 1 / zoom_diff,
            e: -mouseX * (1 / zoom_diff - 1),
            f: -mouseY * (1 / zoom_diff - 1),
          })
        );

        // NOTE When unsure if this tweaking works, uncomment this
        // let point_zero = new_transform.applyToCoords({ x: 0, y: 0 });
        // let point_one = new_transform.applyToCoords({ x: 1, y: 0 });
        // let zoom_scale = point_one.x - point_zero.x;
        // let zoom_diff2 = zoom_scale / clamp(zoom_scale, minZoom, maxZoom);
        // if (zoom_diff2 !== 1) {
        //   throw new Error(`After fix, zoom_diff still is not 1 (it should)`)
        // }
      }

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
    const { select_item, children, initialTranslation, transform } = this.props;

    let initial_transform = new Transformation2DMatrix({
      e: -initialTranslation.x,
      f: -initialTranslation.y,
    });

    let invert = initial_transform.multiply(transform.inverse());

    return (
      <ZoomContext.Provider value={{ scale: invert.getScale().x }}>
        <div
          style={{
            overflow: 'hidden',
            height: '100%',
            width: '100%',
            backgroundColor: 'rgb(162, 162, 204)',
          }}
          onWheel={this.onWheel}
          onMouseDown={(e) => {
            // Only reset selected_item if the click is **only** on the canvas,
            // and not actually on one of the divs inside
            if (e.target === e.currentTarget) {
              select_item(null);
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
              transformOrigin: '0% 0%',
            }}
            onMouseDown={(e) => {
              // Only reset selected_item if the click is **only** on the canvas,
              // and not actually on one of the divs inside
              if (e.target === e.currentTarget) {
                select_item(null);
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
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                border: 'solid 1px white',
                borderRadius: 5,
                transform: `translateX(-50%) translateY(-50%)`,
                width: this.props.maxTranslation.x * 2,
                height: this.props.maxTranslation.y * 2,
              }}
            />

            {/* White dot at 0,0 for reference */}
            {/* <div
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundColor: 'white',
                borderRadius: 5,
                transform: `translateX(-50%) translateY(-50%)`,
                width: 10,
                height: 10,
              }}
            /> */}

            {/* Render canvas items or whatever */}
            {children}
          </div>
        </div>
      </ZoomContext.Provider>
    );
  }
}

export default Canvas;
