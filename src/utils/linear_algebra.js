/*
  This file contains some logic for vector and matrix operations: the matrix ones are exported as-is, and vector is its own seperate (exported) object
*/

const isValidMatrix = (m) => {
  // Only allow square matrices
  return (
    m instanceof Array &&
    m.every(
      (row) =>
        row.length === m.length &&
        row.every((value) => typeof value === "number" && !isNaN(value))
    )
  );
};

const isValidVector = (v) => {
  return (
    v instanceof Array &&
    2 <= v.length <= 3 &&
    v.every((value) => typeof value === "number" && !isNaN(value))
  );
};

/*
  Some useful transformation matrices, taken from https://en.wikipedia.org/wiki/Affine_transformation.
  (See http://matrixmultiplication.xyz/ for a refresher on matrix multiplication)
*/

export const identity_matrix = () => {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
};

export const translation_matrix = ([x = 0, y = 0]) => {
  let [c, f] = [x, y];
  return [
    [1, 0, c],
    [0, 1, f],
    [0, 0, 1],
  ];
};

export const reflection_matrix = ([x = true, y = true]) => {
  let [a, e] = [x ? -1 : 1, y ? -1 : 1];
  return [
    [a, 0, 0],
    [0, e, 0],
    [0, 0, 1],
  ];
};

export const scale_matrix = ([x = 1, y = 1]) => {
  let [a, e] = [x, y];
  return [
    [a, 0, 0],
    [0, e, 0],
    [0, 0, 1],
  ];
};

export const rotation_matrix = (angle = 0) => {
  // angle should be in radians!
  let [a, d, b, e] = [
    Math.cos(angle),
    Math.sin(angle),
    -Math.sin(angle),
    Math.cos(angle),
  ];
  return [
    [a, b, 0],
    [d, e, 0],
    [0, 0, 1],
  ];
};

export const shear_matrix = ([x = 0, y = 0]) => {
  let [b, d] = [x, y];
  return [
    [1, b, 0],
    [d, 1, 0],
    [0, 0, 1],
  ];
};

/*
  General Matrix object
*/
export const matrix = {
  // multiply :: (Matrix, Matrix) -> Matrix
  multiply: (...args) => {
    // Multiply two matrices together - watch out! This is non-commutative, i.e. AB =/= BA
    return args.reduce((m1, m2) => {
      let [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] = m1;
      let [[a2, b2, c2], [d2, e2, f2], [g2, h2, i2]] = m2;

      return [
        [
          a1 * a2 + b1 * d2 + c1 * g2,
          a1 * b2 + b1 * e2 + c1 * h2,
          a1 * c2 + b1 * f2 + c1 * i2,
        ],
        [
          d1 * a2 + e1 * d2 + f1 * g2,
          d1 * b2 + e1 * e2 + f1 * h2,
          d1 * c2 + e1 * f2 + f1 * i2,
        ],
        [
          g1 * a2 + h1 * d2 + i1 * g2,
          g1 * b2 + h1 * e2 + i1 * h2,
          g1 * c2 + h1 * f2 + i1 * i2,
        ],
      ];
    }, identity_matrix());
  },
  // determinant :: Matrix -> Number
  determinant: (m) => {
    if (m.length !== m[0].length) {
      throw new Error("Not a square matrix!");
    }

    let dimension = m.length;

    if (dimension === 2) {
      let [[a, b], [c, d]] = m;
      return a * d - b * c;
    }

    if (dimension === 3) {
      let [[a, b, c], [d, e, f], [g, h, i]] = m;
      return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    }
  },
  // inverse :: Matrix -> Matrix
  inverse: (m) => {
    // Compute the inverse of a square matrix A such that AB = BA = I, where B = A^(-1)
    let det = matrix.determinant(m);
    console.log("det", det);

    if (det === 0) {
      throw new Error("Matrix is not invertible!");
    }

    let [[a, b, c], [d, e, f], [g, h, i]] = m;

    return [
      [e * i - f * h, -(b * i - c * h), b * f - c * e],
      [-(d * i - f * g), a * i - c * g, -(a * f - c * d)],
      [d * h - e * g, -(a * h - b * g), a * e - b * d],
    ].map((row) => row.map((val) => val / det));
  },
  // toString :: Matrix -> String
  toString: (...args) => {
    let all_transforms = args
      .map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }

        let [[a, b, c], [d, e, f], [g, h, i]] = arg;
        return `matrix(${a}, ${d}, ${b}, ${e}, ${c}, ${f})`;
      })
      .join(" ");

    return all_transforms;
  },
  // apply :: (Matrix, Vector) -> Vector
  apply: (m, v) => {
    let [[a, b, c], [d, e, f], [g, h, i]] = m;
    let [x, y, z = 1] = v;

    return [
      a * x + b * y + c * z,
      d * x + e * y + f * z,
      g * x + h * y + i * z,
    ];
  },
  // add :: (Matrix, Matrix) -> Matrix
  add: (m1, m2) => {
    if (isValidMatrix(m1) && isValidMatrix(m2)) {
      let [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] = m1;
      let [[a2, b2, c2], [d2, e2, f2], [g2, h2, i2]] = m2;

      return [
        [a1 + a2, b1 + b2, c1 + c2],
        [d1 + d2, e1 + e2, f1 + f2],
        [g1 + g2, h1 + h2, i1 + i2],
      ];
    }
  },
  // getScale :: Matrix -> Number
  getScale: (m) => {
    let [[a, b, c], [d, e, f], [g, h, i]] = m;

    if (a !== e) {
      console.warn(
        `Watch out! Your x and y scales are different: ${a}, ${e}, but getScale only returns the first!`
      );
    }

    return a;
  },
  // bounds = { a: { min: -5, max: 5 } }
  clampMatrix: (m, bounds = {}) => {
    let [[a, b, c], [d, e, f], [g, h, i]] = m;

    let {
      a: new_a,
      b: new_b,
      c: new_c,
      d: new_d,
      e: new_e,
      f: new_f,
    } = "abcdef".split("").reduce(
      (values, letter) => {
        let { min, max } = bounds?.[letter] || {};
        let value = values[letter];

        if (min && value < min) {
          console.log("clamping", value, "to", min);
          values[letter] = min;
        }

        if (max && value > max) {
          console.log("clamping", value, "to", max);
          values[letter] = max;
        }

        return values;
      },
      { a, b, c, d, e, f }
    );

    return [
      [new_a, new_b, new_c],
      [new_d, new_e, new_f],
      [g, h, i],
    ];
  },
};

/*
  General Vector object
*/
export const vector = {
  // add :: (Vector, Vector) -> Vector
  add: ([x1, y1], [x2, y2]) => {
    return [x1 + x2, y1 + y2];
  },
  // rotate :: (Vector, Number) -> Vector
  rotate: ([x, y], angle) => {
    // angle should be in radians!
    return matrix.apply(rotation_matrix(angle), [x, y]);
  },
  // to_angle :: () -> Number
  to_angle: ([x, y]) => Math.atan2(y, x),
  // multiply :: (Vector, Vector) -> Vector
  multiply: ([x1, y1], [x2, y2]) => {
    // Technically this is called a "Hadamard product" but who cares
    return [x1 * x2, y1 * y2];
  },
};
