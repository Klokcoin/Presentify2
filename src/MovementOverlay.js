import React, { Component } from 'react'

class MovementOverlay extends Component {
  render() {
    const { children } = this.props
    return (
      <div>
        {children}
      </div>
    )
  }
}

export default MovementOverlay