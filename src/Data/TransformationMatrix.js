import { clamp } from "lodash";

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
};

export class Transformation3DMatrix {
  constructor(raw) {
    this.raw = {
      ...default3dMatrix,
      ...raw,
    };
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
export class Transformation2DMatrix {
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
      a: a * a2 + c * b2,
      b: b * a2 + d * b2,
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
      throw new Error("Matrix is not invertible!");
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
