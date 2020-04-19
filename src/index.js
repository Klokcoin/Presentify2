import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "styled-components";

import "./index.css";
import "@fortawesome/fontawesome-free/css/all.css";

import Workspace from "./Workspace";
import { PresentifyProvider } from "./PresentifyContext";
import { ItemPreviewProvider } from "./Data/ItemPreviewContext.js";
import { dark_theme } from "./themes";

ReactDOM.render(
  <div style={{ height: "100vh", width: "100vw" }}>
    <ThemeProvider theme={dark_theme}>
      <ItemPreviewProvider>
        <PresentifyProvider>
          <Workspace />
        </PresentifyProvider>
      </ItemPreviewProvider>
    </ThemeProvider>
  </div>,
  document.getElementById("root")
);
