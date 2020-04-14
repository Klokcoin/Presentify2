/*
  Some useful transformation matrices, taken from https://en.wikipedia.org/wiki/Affine_transformation.
  (See http://matrixmultiplication.xyz/ for a refresher on matrix multiplication)
*/

const identity_matrix = () => {
  return matrix([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
};

const translation_matrix = ([x = 0, y = 0]) => {
  let [c, f] = [x, y];
  return matrix([
    [1, 0, c],
    [0, 1, f],
    [0, 0, 1],
  ]);
};

const reflection_matrix = ([x = true, y = true]) => {
  let [a, e] = [x ? -1 : 1, y ? -1 : 1];
  return matrix([
    [a, 0, 0],
    [0, e, 0],
    [0, 0, 1],
  ]);
};

const scale_matrix = ([x = 1, y = 1]) => {
  let [a, e] = [x, y];
  return [
    [a, 0, 0],
    [0, e, 0],
    [0, 0, 1],
  ];
};

const rotation_matrix = (θ = 0) => {
  // θ should be in radians!
  let [a, d, b, e] = [Math.cos(θ), Math.sin(θ), -Math.sin(θ), Math.cos(θ)];
  return matrix([
    [a, b, 0],
    [d, e, 0],
    [0, 0, 1],
  ]);
};

const shear_matrix = ([x = 0, y = 0]) => {
  let [b, d] = [x, y];
  return matrix([
    [1, b, 0],
    [d, 1, 0],
    [0, 0, 1],
  ]);
};

/*
  A few common matrix operations. These can be called with Arrays, or with Matrix objects defined further below
*/
// Multiply two matrices together - watch out! This is non-commutative, i.e. AB =/= BA
// multiply :: (Array || Matrix, Array || Matrix) -> Array
const multiply = (m1, m2) => {
  let [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] =
    m1 instanceof Array ? m1 : m1.value();
  let [[a2, b2, c2], [d2, e2, f2], [g2, h2, i2]] =
    m2 instanceof Array ? m2 : m2.value();

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
};

// Transpose a matrix, i.e. change rows to columns and vice-versa
// transpose :: Array || Matrix -> Array
const transpose = (m) => {
  let [[a, b, c], [d, e, f], [g, h, i]] = m instanceof Array ? m : m.value();

  return [
    [a, d, g],
    [b, e, h],
    [c, f, i],
  ];
};

// Compute the determinant of a matrix
// determinant :: Array || Matrix -> Number
const determinant = (_m) => {
  let m = _m instanceof Array ? _m : _m.value();

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
};

// Compute the adjugate of a matrix (https://en.wikipedia.org/wiki/Adjugate_matrix)
// adjugate :: Array || Matrix -> Array
const adjugate = (_m) => {
  let m = _m instanceof Array ? _m : _m.value();

  let [[a, b, c], [d, e, f], [g, h, i]] = transpose(m);

  let cofactors = [
    [
      a *
        determinant([
          [e, f],
          [h, i],
        ]),
      b *
        determinant([
          [d, f],
          [g, i],
        ]),
      c *
        determinant([
          [d, e],
          [g, h],
        ]),
    ],
    [
      d *
        determinant([
          [b, c],
          [h, i],
        ]),
      e *
        determinant([
          [a, c],
          [g, i],
        ]),
      f *
        determinant([
          [a, b],
          [g, h],
        ]),
    ],
    [
      g *
        determinant([
          [b, c],
          [e, f],
        ]),
      h *
        determinant([
          [a, c],
          [d, f],
        ]),
      i *
        determinant([
          [a, b],
          [d, e],
        ]),
    ],
  ];

  return multiply(cofactors, [
    [+1, -1, +1],
    [-1, +1, -1],
    [+1, -1, +1],
  ]);
};

// Compute the inverse of a square matrix A such that AB = BA = I, where B = A^(-1)
// inverse :: Array || Matrix -> Array
const inverse = (_m) => {
  let m = _m instanceof Array ? _m : _m.value();

  let det = determinant(m);

  if (det === 0) {
    throw new Error("Matrix is not invertible!");
  }

  let adjug = adjugate(m);

  let inv = adjug.map((value) => value / determinant);

  return matrix(inv);
};

/*
  General matrix object, so we can more easily chain operations together
*/
// matrix :: Array -> Matrix
const matrix = ([
  [a = 1, b = 0, c = 0] = [],
  [d = 0, e = 1, f = 0] = [],
  [g = 0, h = 0, i = 1] = [],
] = []) => {
  let myself = [
    [a, b, c],
    [d, e, f],
    [g, h, i],
  ];

  return {
    // value :: () -> Array
    value: () => myself,
    // multiply :: Matrix || Array -> Matrix
    multiply: (otherMatrix) => {
      return matrix(multiply(myself, otherMatrix));
    },
    // inverse :: () -> Matrix
    inverse: () => {
      return inverse(myself);
    },
    // apply :: Vector || Array -> Vector
    apply: (otherVector) => {
      return vector(apply(myself, otherVector));
    },
  };
};

// apply :: (Matrix || Array, Vector || Array) -> Array
const apply = (m, v) => {
  let [[a, b, c], [d, e, f], [g, h, i]] = m instanceof Array ? m : m.value();
  let [x, y, z = 1] = v instanceof Array ? v : v.value();

  return [a * x + b * y + c * z, d * x + e * y + f * z, g * x + h * y + i * z];
};

/*
  General vector object
*/
const vector = ([x, y, z = 1]) => {
  return {
    value: () => [x, y],
    add: ([x2, y2, z2 = 1]) => [x + x2, y + y2, 1 /*, z + z2 */],
    rotate: () => {},
    to_rotation: () => {},
  };
};

const doZoom = (
  [centerX, centerY],
  [scaleX, scaleY],
  world_transform = identity_matrix()
) => {
  let zoom_matrix = translation_matrix([centerX, centerY])
    .multiply(scale_matrix([scaleX, scaleY]))
    .multiply(translation_matrix([-centerX, -centerY]))
    .multiply(world_transform);
  return zoom_matrix.value();
};

console.log("doZoom([40, 40], [2, 2])", doZoom([40, 40], [2, 2]));
