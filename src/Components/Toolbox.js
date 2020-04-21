import React, { useContext, useRef, useEffect } from "react";
import styled, { useTheme } from "styled-components/macro";

const Container = styled.div`
  pointer-events: auto;
  margin: 0.3rem auto;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;

  color: white;
  background: ${({ theme }) => theme.interface[2]};
  padding: 0.3rem 1rem;

  font-size: 1.3rem;
  box-shadow: 0px 0px 10px -2px rgba(0, 0, 0, 0.75);
  border-radius: 0.25rem;
`;

let ComponentIcon = styled.div`
  margin: 5px 10px 5px 0;
`;

const ToolButton = styled.div``;

export const Toolbox = (props) => {
  const { component_map, add_item } = props;
  let theme = useTheme();

  return (
    <Container theme={theme}>
      {Object.entries(component_map).map(([key, comp]) => (
        <ToolButton title={comp.name} onClick={() => add_item({ type: key })}>
          <ComponentIcon>{comp.icon}</ComponentIcon>
        </ToolButton>
      ))}
    </Container>
  );
};
