import React from "react";
import { SketchPicker } from "react-color";
import styled from "styled-components/macro";
import { Webcam, SelectVideoDevice } from "./Webcam";
import { theme } from "../themes/index";

import { LoadFile } from "../Workspace.js";

let WebviewIconFrame = styled.div`
  // border: solid 2px var(--color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 3px;
  // font-size: calc(1em - 4px);
`;

export let component_map = {
  "dralletje/artboard": {
    icon: <i className="fas fa-chess-board" />,
    name: "Canvas",
    Component: () => {
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
    Component: ({ options }) => {
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
    Component: ({ options }) => {
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
          backgroundColor: theme.textColorPrimary,
          borderRadius: 1,
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
    Component: ({ options }) => {
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
    Component: ({ options }) => {
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
  group: {
    icon: <i className="fas fa-object-group"></i>,
    name: "Group",
    hide_in_toolbox: true,
    groupItems: [],
    default_options: {
      backgroundColor: "#B50004",
    },
  },
  "jwestendorp/webcam": {
    icon: <i className="fas fa-video"></i>,
    name: "Webcam",
    default_options: {
      backgroundColor: "#B50004",
      deviceId: "",
    },
    ConfigScreen: ({ value, onChange }) => {
      return (
        <div style={{ padding: 8, flexShrink: 0 }}>
          <SelectVideoDevice
            value={value}
            onChange={(deviceId) => onChange({ deviceId })}
          />
        </div>
      );
    },
    Component: ({ size, options }) => {
      return (
        <div style={{ height: "100%", width: "100%" }}>
          <Webcam size={size} deviceId={options.deviceId} />
        </div>
      );
    },
  },
};
