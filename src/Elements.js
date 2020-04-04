import React from "react";
import ComponentComponent from "@reach/component-component";

/*
Simple component that will not render anything.
On mount it will bind to a document event, and it will clean up on unmount
  <DocumentEvent
    name="scroll"
    handler={updateScrollPosition}
  />
*/

/*:flow
type T_documentevent_props = {
  handler: (e: any) => mixed,
  name: string,
  passive?: boolean,
};
*/

export class DocumentEvent extends React.Component /*:<T_documentevent_props>*/ {
  /*:flow
  unbind: () => void
  */

  componentDidMount() {
    let fn = (e) => {
      if (!this.props.passive) e.preventDefault();
      this.props.handler(e);
    };
    document.addEventListener(this.props.name, fn, {
      capture: this.props.capture,
    });
    this.unbind = () => {
      document.removeEventListener(this.props.name, fn);
    };
  }

  componentWillUnmount() {
    this.unbind();
  }

  render() {
    return null;
  }
}

export class Draggable extends React.Component {
  state = {
    dragging_state: null,
  };

  // screen_position = null;

  render() {
    let { dragging_state } = this.state;
    let { onMove, onMoveEnd, children, cursor, style, ...props } = this.props;

    return (
      <React.Fragment>
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
            this.setState({
              dragging_state: {
                start_mouse_x: e.pageX,
                start_mouse_y: e.pageY,
              },
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
              this.setState({ dragging_state: null });
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
      </React.Fragment>
    );
  }
}

export let Absolute = ({
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

export let DraggingCircle = ({ style }) => {
  return (
    <div
      style={{
        padding: 16,
        margin: -16,
      }}
    >
      <div
        style={{
          margin: -4,
          border: `solid 1px black`,
          backgroundColor: "white",
          height: 8,
          width: 8,
          borderRadius: "50%",
          ...style,
        }}
      />
    </div>
  );
};

export let Whitespace = ({ height, width }) => {
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

export let Layer = ({ style, children }) => {
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
