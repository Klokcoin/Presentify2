import React from 'react';
import { Layer } from '../Elements.js';

export let Dropoverlay = ({ is_dragging }) => {
  return (
    <Layer
      style={{
        zIndex: 10,
        backgroundColor: 'rgba(138, 245, 129, 0.8)',
        color: 'black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity .2s',
        opacity: is_dragging ? 1 : 0,
        pointerEvents:  is_dragging ? 'all' : 'none',
      }}
    >
      <div
        style={{
          padding: 32,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 5,
        }}
      >
        Add image to your canvas
      </div>
    </Layer>
  )
}
