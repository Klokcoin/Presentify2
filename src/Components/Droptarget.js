import React from "react";
import { debounce } from "lodash";

export const Droptarget = ({ onDrop, children, ...props }) => {
  const [is_dragging, set_is_dragging] = React.useState(false);
  const dragleave_debounce = React.useRef(
    debounce((fn) => {
      return fn();
    }, 100)
  ).current;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (is_dragging === false) {
          set_is_dragging(true);
        } else {
          dragleave_debounce(() => {
            set_is_dragging(false);
          });
        }
      }}
      onDrop={async (e) => {
        e.preventDefault();
        onDrop(e);
      }}
      {...props}
      children={
        typeof children === "function" ? children(is_dragging) : children
      }
    />
  );
};
