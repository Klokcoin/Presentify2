import React from "react";
import styled from "styled-components/macro";

let Container = styled.div`
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
`;

export function LayerList({ children }) {
  // let  = props
  return <Container>{children}</Container>;
}

let Draggable = styled.div``;

function LayerListItem(props) {
  return <Draggable>{props.children}</Draggable>;
}
