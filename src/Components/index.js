import React from 'react';

export let component_map = {
  'dralletje/webview': {
    name: 'webview',
    default_options: {
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    },
    Component: ({ size, options }) => {
      return (
        <iframe
          // width={size.width}
          // height={size.height}
          style={{ height: '100%', width: '100%' }}
          src={options.url || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        />
      );
    },
  },
  'dralletje/rectangle': {
    name: 'Rectangle',
    default_options: {
      backgroundColor: 'blue',
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
