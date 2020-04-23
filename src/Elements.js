import React from "react";
import ComponentComponent from "@reach/component-component";
import styled from "styled-components/macro";

/*
Simple component that will not render anything.
On mount it will bind to a document event, and it will clean up on unmount
  <DocumentEvent
    name="scroll"
    handler={updateScrollPosition}
  />
*/

export const DocumentEvent = ({
  handler,
  name,
  passive = false,
  capture = false,
}) => {
  let fn = React.useCallback(
    (event) => {
      if (!passive) {
        event.preventDefault();
      }
      handler(event);
    },
    [passive, handler]
  );

  React.useEffect(() => {
    document.addEventListener(name, fn, { capture });

    return function cleanup() {
      // the { capture } options obj is necessary for it to remove the correct listener!
      document.removeEventListener(name, fn, { capture });
    };
  }, [fn, name, capture]);

  return null;
};

export const Draggable = ({
  onMove,
  onMoveStart,
  onMoveEnd,
  cursor,
  style,
  children,
  ...props
}) => {
  const [dragging_state, set_dragging_state] = React.useState(null);

  return (
    <>
      {dragging_state && cursor && (
        <ComponentComponent
          key={cursor} // So it re-mounts on cursor change
          didMount={({ setState }) => {
            let previous_cursor = document.body.style.cursor;
            document.body.style.cursor = cursor;
            setState({ previous_cursor });
          }}
          willUnmount={({ state }) => {
            document.body.style.cursor = state.previous_cursor;
          }}
        />
      )}
      <div
        style={{
          cursor: cursor,
          ...style,
        }}
        data-what-is-this="Draggable"
        onMouseDown={(e) => {
          set_dragging_state({
            start_mouse_x: e.pageX,
            start_mouse_y: e.pageY,
          });

          onMoveStart &&
            onMoveStart({
              x: e.pageX,
              y: e.pageY,
              absolute_x: e.pageX,
              absolute_y: e.pageY,
            });
        }}
        {...props}
      >
        {children}
      </div>

      {dragging_state != null && (
        <DocumentEvent
          name="mousemove"
          handler={(e) => {
            if (dragging_state != null) {
              const { x, y } = {
                x: e.pageX - dragging_state.start_mouse_x,
                y: e.pageY - dragging_state.start_mouse_y,
              };

              const { x: absolute_x, y: absolute_y } = {
                x: e.pageX,
                y: e.pageY,
              };

              onMove({
                y,
                x,
                absolute_y,
                absolute_x,
              });
            }
          }}
        />
      )}

      {dragging_state != null && (
        <DocumentEvent
          name="mouseup"
          handler={(e) => {
            document.body.style.cursor = null;
            set_dragging_state(null);
            const { x, y } = {
              x: e.pageX - dragging_state.start_mouse_x,
              y: e.pageY - dragging_state.start_mouse_y,
            };

            onMoveEnd({
              x,
              y,
            });
          }}
        />
      )}
    </>
  );
};

export const Absolute = ({
  left,
  right,
  top,
  bottom,
  children,
  style,
  ...props
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        top,
        bottom,
        ...style,
      }}
      children={children}
      {...props}
    />
  );
};

export const DraggingCircle = ({ size = 8, style }) => {
  return (
    <div
      style={{
        padding: size * 2,
        margin: -size * 2,
      }}
    >
      <div
        style={{
          margin: -size / 2,
          border: `solid 1px black`,
          backgroundColor: "white",
          height: size,
          width: size,
          borderRadius: "50%",
          ...style,
        }}
      />
    </div>
  );
};

export const Whitespace = ({ height, width }) => {
  return (
    <div
      style={{
        height: height != null && height,
        minHeight: height != null && height,
        width: width != null && width,
        minWidth: width != null && width,
      }}
    />
  );
};

export const Layer = ({ style, children }) => {
  return (
    <Absolute
      top={0}
      bottom={0}
      right={0}
      left={0}
      style={style}
      children={children}
    />
  );
};

export let Flex = styled.div`
  display: flex;
  flex-direction: ${(p) => (p.row ? "row" : "column")};
  flex: ${(p) => p.flex};
  align-items: ${(p) => p.alignItems || "stretch"};
  justify-content: ${(p) => p.justifyContent || "flex-start"};
`;

export const Center = styled.div`
  margin: auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
