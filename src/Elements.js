import React from 'react';

/*
Simple component that will not render anything.
On mount it will bind to a document event, and it will clean up on unmount
  <DocumentEvent
    name="scroll"
    handler={updateScrollPosition}
  />
*/
type T_documentevent_props = {
  handler: (e: any) => mixed,
  name: string,
  passive?: boolean,
};

export class DocumentEvent extends React.Component<T_documentevent_props> {
  unbind: () => void;

  componentDidMount() {
    let fn = (e) => {
      if (!this.props.passive) e.preventDefault();
      this.props.handler(e);
    };
    document.addEventListener(this.props.name, fn);
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
    let { onMove, onMoveEnd, children } = this.props;

    return (
      <React.Fragment>
        {dragging_state != null && (
          <DocumentEvent
            name="mousemove"
            handler={(e) => {
              if (dragging_state != null) {
                onMove({
                  y: e.pageY - dragging_state.start_mouse_y,
                  x: e.pageX - dragging_state.start_mouse_x,
                  absolute_y: e.pageY,
                  absolute_x: e.pageX,
                });
              }
            }}
          />
        )}

        {dragging_state != null && (
          <DocumentEvent
            name="mouseup"
            handler={(e) => {
              this.setState({ dragging_state: null });
              onMoveEnd({
                y: e.pageY - dragging_state.start_mouse_y,
                x: e.pageX - dragging_state.start_mouse_x,
                // absolute_y: e.pageY,
                // absolute_x: e.pageX,
              });
            }}
          />
        )}

        <div
          // ref={ref => {
          //   this.container = ref;
          // }}
          onMouseDown={(e) => {
            this.setState({
              dragging_state: {
                start_mouse_x: e.pageX,
                start_mouse_y: e.pageY,
              },
            });
          }}
        >
          {children}
        </div>
      </React.Fragment>
    );
  }
}

export let Absolute = ({ left, right, top, bottom, children, style }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        right,
        top,
        bottom,
        ...style,
      }}
      children={children}
    />
  );
};

export let DraggingCircle = () => {
  return (
    <div
      style={{
        cursor: 'pointer',
        margin: -4,
        border: 'solid 2px black',
        backgroundColor: 'white',
        height: 8,
        width: 8,
        borderRadius: '50%',
      }}
    />
  );
};
