import React, { Component, Fragment } from 'react'
import MovementOverlay from './MovementOverlay'

const components = [
  <div
    style={{
      height: 40,
      width: 40,
      borderRadius: 80,
      position: 'absolute',
      backgroundColor: 'red',
      top: 40,
      left: 40,
    }}
  />,
  <div
    style={{
      height: 40,
      width: 80,
      position: 'absolute',
      backgroundColor: 'blue',
      top: 90,
      left: 60,
    }}
  />,
]

class MovementWorkspace extends Component {
  render() {
    return (
      <Fragment>
        {
          components.map(component =>
            <MovementOverlay>
              {component}
            </MovementOverlay>
          )
        }
      </Fragment>
    )
  }
}

export default MovementWorkspace