import React from 'react';

import Workspace from './Workspace'

export default class App extends React.Component {
  render() {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>  
        <Workspace/>
      </div>
    )
  }
}
