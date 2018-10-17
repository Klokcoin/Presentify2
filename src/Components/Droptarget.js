import React from 'react';
import { debounce } from 'lodash';

export class Droptarget extends React.Component {
  state = {
    is_dragging: false,
  }

  dragleave_debounce = debounce((fn) => {
    return fn();
  }, 100);

  render() {
    let { is_dragging } = this.state;
    let { onDrop, children, ...props } = this.props;

    // TODO `isValidDrop` prop to check on onDragOver ?

    return <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.state.is_dragging === false) {
          this.setState({ is_dragging: true });
        } else {
          this.dragleave_debounce(() => {
            this.setState({ is_dragging: false });
          });
        }
      }}
      onDrop={async (e) => {
        e.preventDefault();
        onDrop(e);
      }}
      {...props}
      children={typeof children === 'function' ? children(is_dragging) : children}
    />
  }
}
