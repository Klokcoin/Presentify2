// uhm voor highlighting
import { css } from "styled-components";

const GRAY = "hsl(210, 2%, 18%)";
const LIGHT_GRAY = "hsl(240, 0%, 49%)";
const WHITE = "hsl(0, 0%, 100%)";

//alles wat alleen afhankelijk is van theme\

const THEME_HUE = 218; //old 195

const darkShades = [
  `hsl(${THEME_HUE}, 8%, 8%)`,
  `hsl(${THEME_HUE}, 15%, 13%)`,
  `hsl(${THEME_HUE}, 16%, 20%)`,
  `hsl(${THEME_HUE}, 30%, 20%)`,
  `hsl(${THEME_HUE}, 55%, 25%)`,
  `hsl(${THEME_HUE}, 59%, 48%)`,
];

export const dark_theme = {
  interface: {
    0: darkShades[0],
    1: darkShades[1],
    2: darkShades[2],
    3: darkShades[3],
    4: darkShades[4],
    5: darkShades[5],
    hover: darkShades[4],
  },

  // backgroundColorLight: "hsl(200, 6%, 30%)",
  // backgroundColorMedium: "hsl(200, 6%, 19%)",
  // backgroundColorDark: "hsl(200, 6%, 12%)",

  textColorPrimary: "hsl(0, 0%, 93%)",
  textColorAccent: "hsl(45, 100%, 50%)",

  // hsl(195,84%,72%);
  // hsl(196,90%,35%)

  layerList: {
    hoverColor: "SeaGreen",
    layer: {
      hoverColor: "hsl(196, 90%, 35%)",
      selectedColor: "hsl(195, 84%, 72%)",
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
export let theme = dark_theme;

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
