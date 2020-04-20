// uhm voor highlighting
import { css } from "styled-components";

const GRAY = "hsl(210, 2%, 18%)";
const LIGHT_GRAY = "hsl(240, 0%, 49%)";
const WHITE = "hsl(0, 0%, 100%)";

//alles wat alleen afhankelijk is van theme\

export const dark_theme = {
  backgroundColorLight: LIGHT_GRAY,
  backgroundColorMedium: GRAY,
  backgroundColorDark: "darkgrey",

  textColorPrimary: "hsl(0, 0%, 93%)", 
  textColorAccent: "hsl(45, 100%, 50%)",

  layerList: {
    hoverColor: "SeaGreen",
    layer: {
      hoverColor: "hsl(196, 90%, 35%)",
      selectedColor: "hsl(196, 100%, 60%)",
      backgroundColor: "hsl(0, 0%, 24%)",
      textColor: WHITE,
    },
  },

  canvas: {
    backgroundColor: "hsl(210, 4%, 12%)",
    gridColor: LIGHT_GRAY,
    selectionColor: "hsl(0, 0%, 90%)",
  },

  colors: [
    "hsl(0, 100%, 69%)",
    "hsl(31, 100%, 65%)",
    "hsl(108, 30%, 53%)",
    "hsl(90, 68%, 43%)",
    "hsl(213, 99%, 60%)",
    "hsl(195, 100%, 50%)",
  ],
};

// current theme provider
let theme = dark_theme

//alles wat vaker word gebruikt. 
export const global_styles = {
  backgroundColorLight: css`
    background-color: ${theme.backgroundColorLight};
  `,
  backgroundColorMedium: css`
    background-color: ${theme.backgroundColorMedium};
  `,
  backgroundColorDark: css`
    background-color: ${theme.backgroundColorDark};
  `,

  heading: css`
    font-family: "Roboto Condensed";
    font-size: 22px;
    color: ${theme.textColorPrimary};
    text-transform: uppercase;
    padding: 5px;
    `,

  text: css`
    font-family: "Roboto";
    font-size: 15px;
    color: ${theme.textColorPrimary};
  `,

  mono: css`
    font-family: "Roboto Mono";
  `,


};



