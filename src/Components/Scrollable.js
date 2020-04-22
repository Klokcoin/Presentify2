import React from "react";
import styled, { useTheme } from "styled-components/macro";

import { Scrollbar } from "react-scrollbars-custom";

export const Scrollable_y = (props) => {
  let theme = useTheme();
  return (
    <Scrollbar
      wrapperProps={{ style: { right: "18px" } }}
      trackYProps={{
        style: { opacity: 0.7, background: theme.interface[0] },
      }}
      thumbYProps={{ style: { background: theme.interface[2] } }}
    >
      {props.children}
    </Scrollbar>
  );
};
