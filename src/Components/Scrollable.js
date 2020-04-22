import React from "react";
import styled, { useTheme } from "styled-components/macro";

import { Scrollbar } from "react-scrollbars-custom";

const Container_y = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 3px;
`;

const ContentWrapper = styled.div`
  position: relative !important;
`;

const Track_y = styled.div`
  position: relative !important;
  opacity: 0.7;
  background: ${({ theme }) => theme.interface[0]} !important;
`;

export const Scrollable_y = (props) => {
  let theme = useTheme();
  return (
    <Scrollbar
      renderer={({ elementRef, ...restProps }) => (
        <Container_y {...restProps} ref={elementRef} />
      )}
      wrapperProps={{
        renderer: ({ elementRef, ...restProps }) => (
          <ContentWrapper {...restProps} ref={elementRef} />
        ),
      }}
      trackYProps={{
        renderer: ({ elementRef, ...restProps }) => (
          <Track_y theme={theme} {...restProps} ref={elementRef} />
        ),
      }}
      thumbYProps={{
        style: {
          background: theme.interface[2],
        },
      }}
    >
      {props.children}
    </Scrollbar>
  );
};
