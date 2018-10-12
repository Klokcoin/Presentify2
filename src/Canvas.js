import React, { Component } from 'react';
import { clamp } from 'lodash';

const isWhole = (number) => number % 1 === 0;

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
      a: a * a2 + b2 * c,
      b: a2 * b + b2 * d,
      c: a * c2 + c * d2,
      d: b * c2 + d * d2,
      e: a * e2 + c * f2 + e,
      f: b * e2 + d * f2 + f,
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
}

class Canvas extends Component {
  static defaultProps = {
    maxTranslation: {
      // I don't yet see a reason to limit this...
      x: 99999,
      y: 99999,
    },
    minZoom: 0.5,
    maxZoom: 3,
  };

  state = {
    transform: new Transformation2DMatrix(),
    zoom: 10,
    translation: {
      x: 0,
      y: 0,
    },
  };

  doTranslation = ({ deltaX, deltaY }) => {
    this.setState(({ transform, translation}) => {
      const { maxTranslation: max } = this.props;

      // 'Normalize' the translation speed, we multiply our deltas by the current scale,
      // so we pan slower at close zooms & faster at far zooms
      const {
        x: relativeDeltaX,
        y: relativeDeltaY,
      } = transform.inverseScale().applyToCoords({
        x: deltaX,
        y: deltaY,
      });

      const newTranslation = {
        x: translation.x - relativeDeltaX,
        y: translation.y - relativeDeltaY,
      };

      // if (
      //   (translation.x === newTranslation.x &&
      //     translation.y === newTranslation.y) ||
      //   Math.abs(newTranslation.x) > max.x ||
      //   Math.abs(newTranslation.y) > max.y
      // ) {
      //   return;
      // }

      return {
        transform: transform.multiply(
          new Transformation2DMatrix({
            e: -relativeDeltaX,
            f: -relativeDeltaY,
          })
        ),
        translation: newTranslation,
      };
    });
  };

  doZoom = ({ clientX, clientY, deltaY }) => {
    this.setState(({ transform, zoom }) => {
      const { maxZoom, minZoom } = this.props;

      const scale = 1 - 1 / 110 * deltaY;

      // We need to apply the inverse of the current transformation to the mouse coordinates
      // to get the 'actual' click coordinates
      const {
        x: mouseX,
        y: mouseY,
      } = transform.inverse().applyToCoords({
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
      )

      let point_zero = new_transform.applyToCoords({ x: 0, y: 0 });
      let point_one = new_transform.applyToCoords({ x: 1, y: 0 });
      let zoom_scale = point_one.x - point_zero.x;
      let zoom_diff = zoom_scale / clamp(zoom_scale, minZoom, maxZoom);

      if (zoom_diff !== 1) {
        // Out of bounds, but instead of not applying the transformation,
        // apply it as far as we can.
        new_transform = new_transform.multiply(
          new Transformation2DMatrix({
            a: 1 / zoom_diff,
            d: 1 / zoom_diff,
            e: -mouseX * ((1 / zoom_diff) - 1),
            f: -mouseY * ((1 / zoom_diff) - 1),
          })
        )

        // NOTE When unsure if this tweaking works, uncomment this
        // let point_zero = new_transform.applyToCoords({ x: 0, y: 0 });
        // let point_one = new_transform.applyToCoords({ x: 1, y: 0 });
        // let zoom_scale = point_one.x - point_zero.x;
        // let zoom_diff2 = zoom_scale / clamp(zoom_scale, minZoom, maxZoom);
        // if (zoom_diff2 !== 1) {
        //   throw new Error(`After fix, zoom_diff still is not 1 (it should)`)
        // }
      }

      return {
        transform: new_transform,
      }
    });
  };

  onWheel = (event) => {
    event.preventDefault();
    const { deltaX, deltaY } = event;
    const { doTranslation, doZoom } = this;

    if (event.ctrlKey) {
      doZoom(event);
    } else {
      doTranslation(event);
    }
  };

  render() {
    const { select_item, children } = this.props;
    const { transform } = this.state;

    return (
      <div
        style={{
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          backgroundColor: 'rgb(162, 162, 204)',
        }}
        onWheel={this.onWheel}
      >
        <div
          style={{
            transform: transform.toString(),
            transformOrigin: '0% 0%',
          }}
          onClick={(e) => {
            // Only reset selected_item if the click is **only** on the canvas,
            // and not actually on one of the divs inside
            if (e.target === e.currentTarget) {
              select_item(null);
            }
          }}
        >
          {/*
              Provide our children with a method that inverses the current scale,
              useful for accurate pointer events
          */}
          {
           children({
            inverseScale: transform.inverseScale().applyToCoords
           })
          }
        </div>
      </div>
    );
  }
}

export default Canvas;
