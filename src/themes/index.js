const GRAY = "hsl(210, 2%, 18%)";
const LIGHT_GRAY = "hsl(240, 0%, 49%)";
const WHITE = "hsl(0, 0%, 100%)";

export const dark_theme = {
  ui: {
    backgroundColor: "hsl(210, 2%, 18%)",

    heading: {
      color: "hsl(180, 1%, 48%)",
      fontFamily: "Roboto Condensed",
    },
    text: {
      color: "hsl(180, 1%, 88%)",
      fontFamily: "Roboto",
    },
    mono: {
      fontFamily: "Roboto Mono",
      fontSize: 13,
    },
    layerList: {
      hoverColor: "SeaGreen",
      layer: {
        hoverColor: "hsl(196, 90%, 35%)",
        selectedColor: "hsl(196, 100%, 60%)",
        backgroundColor: "hsl(0, 0%, 24%)",
        textColor: WHITE,
      },
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
