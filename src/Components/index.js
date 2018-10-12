import React from 'react';
import { SketchPicker } from 'react-color';

export let component_map = {
  'dralletje/artboard': {
    icon: <i className="fas fa-chess-board" />,
    name: 'Canvas',
    Component: ({ size }) => {
      return (
        <div
          style={{
            backgroundColor: 'rgb(255, 255, 255)',
            boxShadow: '0px 3px 20px black',
            width: '100%',
            height: '100%',
          }}
        />
      );
    },
  },
  'dralletje/webview': {
    icon: <i className="fas fa-globe" />,
    name: 'Webview',
    default_options: {
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    },
    Component: ({ size, options }) => {
      return (
        <iframe
          // width={size.width}
          // height={size.height}
          style={{ height: '100%', width: '100%' }}
          src={options.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        />
      );
    },
  },
  'dralletje/rectangle': {
    icon: (
      <div
        style={{
          height: '1em',
          width: '1em',
          backgroundColor: 'black',
          borderRadius: 3,
        }}
      />
    ),
    name: 'Rectangle',
    default_options: {
      backgroundColor: 'blue',
    },
    ConfigScreen: ({ value, onChange }) => {
      return (
        <div>
          <SketchPicker
            color={value.backgroundColor}
            onChangeComplete={({ rgb }) => {
              onChange({
                backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`,
              });
            }}
          />
        </div>
      );
    },
    Component: ({ size, options }) => {
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: options.backgroundColor || 'rgb(127, 146, 245)',
          }}
        />
      );
    },
  },
  'dralletje/circle': {
    icon: <i className="fas fa-circle" />,
    name: 'Circle',
    default_options: {
      backgroundColor: 'red',
    },
    Component: ({ size, options }) => {
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '50%',
            backgroundColor: options.backgroundColor || 'rgb(127, 146, 245)',
          }}
        />
      );
    },
  },
};
