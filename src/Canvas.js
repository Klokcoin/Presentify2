import React, { Component } from 'react';
import { clamp } from 'lodash';
import memoizeOne from 'memoize-one';

import { IsolateCoordinatesForElement } from './IsolateCoordinatesForElement';

const isWhole = (number) => number % 1 === 0;

let default3dMatrix = {
  a: 1,
  b: 0,
  c: 0,
  d: 0,
  e: 0,
  f: 1,
  g: 0,
  h: 0,
  i: 0,
  j: 0,
  k: 1,
  l: 0,
  m: 0,
  n: 0,
  o: 0,
  p: 1,
}
class Transformation3DMatrix {
  constructor(raw) {
    this.raw = {
      ...default3dMatrix,
      ...raw,
    }
  }

  // multiply = (otherMatrix) => {
  //   if (otherMatrix instanceof Transformation2DMatrix) {
  //     return new Transformation3DMatrix({
  //
  //     })
  //   }
  //   throw new Error(`Errrr`);
  // }

  to2DMatrix() {
    let { a, b, e, f, m, n } = this.raw;
    return new Transformation2DMatrix({
      a: a,
      b: b,
      c: e,
      d: f,
      e: m,
      f: n,
    });
  }

  toString = () => {
    const { a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p } = this.raw;
    return `matrix3d(
      ${a}, ${b}, ${c}, ${d},
      ${e}, ${f}, ${g}, ${h},
      ${i}, ${j}, ${k}, ${l},
      ${m}, ${n}, ${o}, ${p}
    )`;
  };
}

/*
  Matrix as defined onhttps://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
  [a c e]
  |b d f|
  [0 0 1]
*/
class Transformation2DMatrix {
  constructor({ a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = {}) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  toMatrix3D() {
    return new Transformation3DMatrix({
      a: this.a,
      b: this.b,
      // c: 0,
      // d: 0,
      e: this.c,
      f: this.d,
      // g: 0,
      // h: 0,
      // i: 0,
      // j: 0,
      // k: 1,
      // l: 0,
      m: this.e,
      n: this.f,
      // o: 0,
      // p: 1,
    });
  }

  // String for transform style prop
  toString = () => {
    const { a, b, c, d, e, f } = this;
    return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
  };

  // Multiplying two matrices to get a third matrix, which does both transformations
  multiply = (otherMatrix) => {
    if (!(otherMatrix instanceof Transformation2DMatrix)) {
      throw new Error("Can't multiply a non-Matrix object!");
    }

    const { a: a2, b: b2, c: c2, d: d2, e: e2, f: f2 } = otherMatrix;
    const { a, b, c, d, e, f } = this;

    // just linear algebra don't worry if it looks arcane
    return new Transformation2DMatrix({
      a: (a * a2) + (c * b2),
      b: (b * a2) + (d * b2),
      c: (a * c2) + (c * d2),
      d: (b * c2) + (d * d2),
      e: (a * e2) + (c * f2) + e,
      f: (b * e2) + (d * f2) + f,
    });
  };

  // Computing the inverse of a matrix
  inverse = () => {
    const { a, b, c, d, e, f } = this;
    const determinant = a * d - c * b;

    // Not an invertible matrix!
    if (determinant === 0) {
      throw new Error('Matrix is not invertible!');
    }

    return new Transformation2DMatrix({
      a: d / determinant,
      b: -b / determinant,
      c: -c / determinant,
      d: a / determinant,
      e: (c * f - e * d) / determinant,
      f: (e * b - a * f) / determinant,
    });
  };

  // Inversing only the scale
  inverseScale = () => {
    const { a, b, c, d, e, f } = this;
    return new Transformation2DMatrix({
      a: 1 / a,
      d: 1 / d,
    });
  };

  // Applying the matrix transformation to x and y coordinates
  applyToCoords = ({ x, y }) => {
    const { a, b, c, d, e, f } = this;
    return {
      x: a * x + c * y + e,
      y: b * x + d * y + f,
    };
  };

  getScale = () => {
    let point_zero = this.applyToCoords({ x: 0, y: 0 });
    let point_one = this.applyToCoords({ x: 1, y: 1 });
    return {
      x: point_one.x - point_zero.x,
      y: point_one.y - point_zero.y,
    };
  };

  equals = (otherMatrix) => {
    return (
      this.a === otherMatrix.a &&
      this.b === otherMatrix.b &&
      this.c === otherMatrix.c &&
      this.d === otherMatrix.d &&
      this.e === otherMatrix.e &&
      this.f === otherMatrix.f
    );
  };

  clampTranslation = ({ x, y }) => {
    let revertscale = this.inverseScale();
    let point_zero = revertscale.applyToCoords(
      this.applyToCoords({ x: 0, y: 0 })
    );
    // NOTE I was totally expecting this, to do the same as the above...
    // .... @Jelmar any idea why it doesn't?!
    // let point_zero = new_transform.multiply(revertscale).applyToCoords({ x: 0, y: 0 })));

    let x_overhead = clamp(point_zero.x, x[0], x[1]) - point_zero.x;
    let y_overhead = clamp(point_zero.y, y[0], y[1]) - point_zero.y;
    return this.multiply(
      new Transformation2DMatrix({
        e: x_overhead,
        f: y_overhead,
      })
    );
  };
}

let ZoomContext = React.createContext({ scale: 1 });
export let Unzoom = ({ children }) => {
  if (typeof children === 'function') {
    return <ZoomContext.Consumer children={children} />;
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
    this.setState(({ transform }) => {
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
    this.setState(({ transform, zoom }) => {
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
    const { select_item, children, initialTranslation } = this.props;
    const { transform } = this.state;

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
                backgroundColor: 'rgba(0,0,0,.3)',
                borderRadius: 5,
                transform: `translateX(-50%) translateY(-50%)`,
                width: this.props.maxTranslation.x * 2,
                height: this.props.maxTranslation.y * 2,
              }}
            />

            {/* White dot at 0,0 for reference */}
            <div
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
