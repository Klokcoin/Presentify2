import React, { useState, useRef } from "react";
import styled from "styled-components/macro";
// import { useDrag } from "react-use-gesture";
import { SidebarButton, EllipsisOverflow } from "../Workspace";

let List = styled.div`
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
`;

let Container = styled.div`
  position: relative;
`;

let DragOverlay = styled.div`
  border: solid green 1px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // cursor: grabbing;
`;

let DragContainer = styled.div`
  // border: solid blue 1px;
  width: 100%;
  // height: 50px;
  position: absolute;
  top: ${(props) => props.y - 5}px;
  left: 0;
  opacity: 50%;
`;

export function LayerList(props) {
  let { items, selected_id, select_item } = props;
  let [isBeingDragged, set_isBeingDragged] = useState(false);
  let [yOffset, set_yOffset] = useState(0);
  let overlayRef = useRef(null);

  let handleMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let newOffset = e.pageY - overlayRef.current.getBoundingClientRect().top;
    set_yOffset(newOffset);
  };

  return (
    <Container>
      <List>
        {items.map((item) => (
          <LayerListItem id={item.id} set_isBeingDragged={set_isBeingDragged}>
            <SidebarButton
              active={item.id === selected_id}
              onClick={() => select_item(item.id)}
            >
              <EllipsisOverflow>{item.name}</EllipsisOverflow>
            </SidebarButton>
          </LayerListItem>
        ))}
      </List>

      {isBeingDragged && (
        <DragOverlay
          ref={overlayRef}
          onMouseUp={() => set_isBeingDragged(false)}
          onMouseMove={handleMouseMove}
        >
          y:{yOffset}
          <DragContainer y={yOffset}>
            {items.map((item) => {
              if (item.id === isBeingDragged.id) {
                return (
                  <SidebarButton
                    style={{ cursor: "grabbing" }}
                    disabled
                    active={true}
                  >
                    <EllipsisOverflow>{item.name}</EllipsisOverflow>
                  </SidebarButton>
                );
              }
            })}
          </DragContainer>
        </DragOverlay>
      )}
    </Container>
  );
}

let LayerListItemContainer = styled.div`
  width: 100%;
  height: 100%;
`;

export function LayerListItem(props) {
  let { set_isBeingDragged, id, children } = props;

  return (
    <LayerListItemContainer
      onMouseDown={() => set_isBeingDragged({ id })}
      // onMouseUp={() => set_isBeingDragged(null)}
    >
      {children}
    </LayerListItemContainer>
  );
}
