import React from "react";

export const RegularPolygon = ({ options }) => {
  let { points, backgroundColor } = options;

  points = Math.max(3, points);

  let radius = 50;

  let baseAngle = (2 * Math.PI) / points;
  let vertices = [];
  for (let i = 0; i < points; i += 1) {
    let currentAngle = baseAngle * i;
    let x = radius * Math.cos(currentAngle);
    let y = radius * Math.sin(currentAngle);

    vertices[i] = [x, y];
  }

  return (
    <svg
      //   viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      viewBox="-50 -50 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <polygon points={vertices.join(" ")} fill={backgroundColor} />
    </svg>
  );
};
