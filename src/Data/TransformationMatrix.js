import { clamp } from "lodash";

// Do we even need 3d matrices?
export class Transformation3DMatrix {
  constructor({
    a = 1,
    b = 0,
    c = 0,
    d = 0,
    e = 0,
    f = 1,
    g = 0,
    h = 0,
    i = 0,
    j = 0,
    k = 1,
    l = 0,
    m = 0,
    n = 0,
    o = 0,
    p = 1,
  }) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.g = g;
    this.h = h;
    this.i = i;
    this.j = j;
    this.k = k;
    this.l = l;
    this.m = m;
    this.n = n;
    this.o = o;
    this.p = p;
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
    let { a, b, e, f, m, n } = this;
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
    const { a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p } = this;
    return `matrix3d(
      ${a}, ${b}, ${c}, ${d},
      ${e}, ${f}, ${g}, ${h},
      ${i}, ${j}, ${k}, ${l},
      ${m}, ${n}, ${o}, ${p}
    )`;
  };
}

/*
  2D matrix as defined onhttps://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
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

  // JSON.stringify() will recursively call this to serialize the matrix
  // why not just serialize as a css transform string, instead of a regular ol' object?
  toJSON = () => {
    return this.toString();
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

  // Applying the matrix transformation to x and y coordinates (assuming z=1; can only multiply 3d vector with 3x3 matrix)
  applyToCoords = ({ x, y }) => {
    const { a, b, c, d, e, f } = this;
    return {
      x: a * x + c * y + e,
      y: b * x + d * y + f,
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

  getScale = () => {
    return {
      x: this.a,
      y: this.d,
    };
  };

  getTranslation = () => {
    return {
      x: this.e,
      y: this.f,
    };
  };

  getRotation = () => {
    let angle = Math.atan2(this.b, this.a); // [radians]
    let degrees = (angle * 180) / Math.PI; // [degrees]
    return degrees;
  };

  scale = (factor) => {
    return this.multiply(scaleMatrix(factor));
  };

  scaleX = (factor) => {
    return this.multiply(scaleXMatrix(factor));
  };

  scaleY = (factor) => {
    return this.multiply(scaleYMatrix(factor));
  };

  translate = (x, y) => {
    return this.multiply(translateMatrix(x, y));
  };

  translateX = (x) => {
    return this.multiply(translateXMatrix(x));
  };

  translateY = (y) => {
    return this.multiply(translateYMatrix(y));
  };

  skew = (x, y) => {
    return this.multiply(skewMatrix(x, y));
  };

  skewX = (x) => {
    return this.multiply(skewXMatrix(x));
  };

  skewY = (y) => {
    return this.multiply(skewYMatrix(y));
  };

  rotate = (angle) => {
    return this.multiply(rotationMatrix(angle));
  };
}

const scaleMatrix = (x, y) => {
  return new Transformation2DMatrix({ a: x, d: y });
};
const scaleXMatrix = (x) => scaleMatrix(x, 1);
const scaleYMatrix = (y) => scaleMatrix(1, y);

const translateMatrix = (x, y) => {
  return new Transformation2DMatrix({ e: x, f: y });
};
const translateXMatrix = (x) => translateMatrix(x, 0);
const translateYMatrix = (y) => translateMatrix(0, y);

const skewMatrix = (x, y) => {
  return new Transformation2DMatrix({ c: Math.tan(x), b: Math.tan(y) });
};
const skewXMatrix = (x) => skewMatrix(x, 0);
const skewYMatrix = (y) => skewMatrix(0, y);

// Rotate about z-axis
const rotationMatrix = (angle) => {
  return new Transformation2DMatrix({
    a: Math.cos(angle),
    b: Math.sin(angle),
    c: -1 * Math.sin(angle),
    d: Math.cos(angle),
  });
};

export const Transformation2DMatrixFromString = (string) => {
  const [a, b, c, d, e, f] = string
    .replace("matrix(", "")
    .replace(")", "")
    .replace(" ", "")
    .split(",")
    .map(parseFloat);

  if ([a, b, c, d, e, f].some((number) => isNaN(number))) {
    console.error(`a,b,c,d,e,f = ${a},${b},${c},${d},${e},${f}`);
    throw new Error(`One of a,b,c,d,e,f was not a number!`);
  }

  return new Transformation2DMatrix({ a, b, c, d, e, f });
};

export const Transformation3DMatrixFromString = (string) => {
  const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p] = string
    .replace("matrix3d(", "")
    .replace(")", "")
    .replace(" ", "")
    .split(",")
    .map(parseFloat);
  return new Transformation3DMatrix({
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    i,
    j,
    k,
    l,
    m,
    n,
    o,
    p,
  });
};
