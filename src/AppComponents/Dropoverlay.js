import React from 'react';
import { Layer } from '../Elements.js';
import styled from 'styled-components';

let TextBox = styled.div`
  padding: 24px;
  color: white;
  font-weight: bold;
  font-size: 20px;
  border-radius: 10px;
  border: white dashed 10px;
`

export let Dropoverlay = ({ is_dragging }) => {
  return (
    <Layer
      style={{
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity .2s',
        opacity: is_dragging ? 1 : 0,
        pointerEvents:  is_dragging ? 'all' : 'none',
      }}
    >
      <TextBox>
        Add image to your canvas
      </TextBox>
    </Layer>
  )
}
