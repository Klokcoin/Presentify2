import React, { Fragment } from 'react';

// import Presentation from './Presentation';
import MovementWorkspace from './MovementWorkspace'
import { Workspace } from './Workspace'

export default class App extends React.Component {
  render() {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>
        <MovementWorkspace>
          <Workspace/>
        </MovementWorkspace>
      </div>
    )
  }
}
