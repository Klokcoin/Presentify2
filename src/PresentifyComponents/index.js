import React from "react";
import { SketchPicker } from "react-color";
import styled from "styled-components";

import { LoadFile } from "../Workspace.js";

let WebviewIconFrame = styled.div`
  border: solid 2px var(--color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 3px;
  font-size: calc(1em - 4px);
`;

export let component_map = {
  "dralletje/artboard": {
    icon: <i className="fas fa-chess-board" />,
    name: "Canvas",
    Component: ({ size }) => {
      return (
        <div
          style={{
            backgroundColor: "rgb(255, 255, 255)",
            boxShadow: "0px 3px 20px black",
            width: "100%",
            height: "100%",
          }}
        />
      );
    },
  },
  "dralletje/image": {
    icon: <i className="fas fa-image" />,
    name: "Image",
    default_options: {
      url:
        "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    },
    Component: ({ size, options }) => {
      return (
        <LoadFile url={options.url}>
          {({ url }) => (
            <div
              style={{
                // backgroundColor: 'rgb(255, 255, 255)',
                backgroundImage: `url(${url})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                width: "100%",
                height: "100%",
              }}
            />
          )}
        </LoadFile>
      );
    },
  },
  "dralletje/webview": {
    icon: (
      <WebviewIconFrame>
        <i className="fas fa-globe" />
      </WebviewIconFrame>
    ),
    name: "Webview",
    default_options: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    },
    Component: ({ size, options }) => {
      return (
        <iframe
          title="iFrame"
          // width={size.width}
          // height={size.height}
          style={{ height: "100%", width: "100%" }}
          src={options.url || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        />
      );
    },
  },
  "dralletje/rectangle": {
    icon: (
      <div
        style={{
          height: "1em",
          width: "1em",
          backgroundColor: "var(--color, black)",
          borderRadius: 3,
        }}
      />
    ),
    name: "Rectangle",
    default_options: {
      backgroundColor: "blue",
      borderRadius: 0,
    },
    ConfigScreen: ({ value, onChange }) => {
      return (
        <div style={{ padding: 8, flexShrink: 0 }}>
          <SketchPicker
            width={null}
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
            height: "100%",
            width: "100%",
            backgroundColor: options.backgroundColor || "rgb(127, 146, 245)",
            borderRadius: options.borderRadius || 0,
          }}
        />
      );
    },
  },
  "dralletje/circle": {
    icon: <i className="fas fa-circle" />,
    name: "Circle",
    default_options: {
      backgroundColor: "#B50004",
    },
    Component: ({ size, options }) => {
      return (
        <div
          style={{
            height: "100%",
            width: "100%",
            borderRadius: "50%",
            backgroundColor: options.backgroundColor || "rgb(127, 146, 245)",
          }}
        />
      );
    },
  },
};
