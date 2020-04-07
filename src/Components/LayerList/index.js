import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";

let List = styled.div`
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  width: 100%;
  overflow-x: hidden;
`;

let Container = styled.div`
  position: relative;
`;

let DragOverlay = styled.div`
  // border: solid green 1px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: grabbing;
`;

let DragContainer = styled.div.attrs((props) => ({
  style: {
    top: props.y - 5,
    left: props.x - 5,
  },
}))`
  width: 12rem;
  // border: 1px solid blue;
  // height: 50px;
  position: fixed;
  // top: ${(props) => props.y - 5}px;
  // left: ${(props) => props.x - 5}px;
  // left: 0;
  opacity: 80%;
  cursor: grabbing;
  pointer-events: none; // this messes with dragging
`;

const HITBOX_HEIGHT = 25;
const HITBOX_PADDING = 10;
let DetectAbove = styled.div`
  z-index: 99;
  position: absolute;
  height: ${2 * HITBOX_PADDING}px;
  top: ${-HITBOX_PADDING}px;
  width: 100%;
  // background: rgba(255, 0, 0, 0.1);

  :hover {
    height: ${2 * HITBOX_PADDING + HITBOX_HEIGHT}px;
  }
`;

let HitboxContainer = styled.div`
  width: 100%;
  height: ${(props) => (props.expand ? HITBOX_HEIGHT + "px" : "0px")};
  position: relative;
  background: rgb(24, 24, 24);
  box-shadow: inset 0 0 4px #000000;

  transition: height 0.15s;
  transition-timing-function: ease;
`;

function InsertArea(props) {
  let { set_insertIndex, draggedItemIndex, listItemIndex, set_mouse } = props;
  let [expand, set_expand] = useState(false);

  function isHoveringItself() {
    if (draggedItemIndex === listItemIndex) return true;
    if (draggedItemIndex === listItemIndex + 1) return true;
    return false;
  }

  let handleMouseOver = () => {
    if (isHoveringItself()) {
      set_insertIndex(null);
      set_expand(false);
    } else {
      set_expand(true);
      if (draggedItemIndex > listItemIndex) {
        set_insertIndex(listItemIndex + 1);
      } else {
        set_insertIndex(listItemIndex);
      }
    }
  };

  // hitbox checks if a item needs to inserted ABOVE
  //
  //  ############# <- hitbox
  //  | list item |
  //  =============

  return (
    <HitboxContainer expand={expand}>
      <DetectAbove
        onMouseEnter={handleMouseOver}
        onMouseLeave={() => set_expand(false)}
        onMouseMove={(e) => set_mouse({ y: e.clientY, x: e.clientX })} // fix this later....
      ></DetectAbove>
    </HitboxContainer>
  );
}

export function LayerList(props) {
  let {
    items,
    selected_id,
    select_item,
    change_itemOrder,
    change_item,
  } = props;

  let [isBeingDragged, set_isBeingDragged] = useState(false);
  let [mouse, set_mouse] = useState(0);
  let [insertIndex, set_insertIndex] = useState(null);

  function handle_dragEnd(id, currentIndex) {
    console.log("DRAG_END", isBeingDragged.id, "newIndex", insertIndex);
    if (insertIndex !== null) change_itemOrder(id, insertIndex);
    set_isBeingDragged(false);
    set_insertIndex(null);
  }

  let change_itemName = (id, newName) => {
    change_item(id, { name: newName });
  };

  // Listitem handles dragStart, dragEnd
  // Insert area sets newIndex

  return (
    <Container>
      <List>
        {isBeingDragged && (
          <InsertArea
            listItemIndex={-1}
            draggedItemIndex={isBeingDragged.index}
            set_insertIndex={set_insertIndex}
            id="bottomLayerInsert"
            set_mouse={set_mouse}
          />
        )}

        {/* THE ITEMS */}
        {items.map((item, i) => (
          <>
            {/* {insertIndex === i && <InsertArea />} */}

            <ListItem
              id={item.id}
              index={i}
              set_isBeingDragged={set_isBeingDragged}
              handle_dragEnd={handle_dragEnd}
              active={item.id === selected_id}
              select_item={() => select_item(item.id)}
              name={item.name}
              change_itemName={change_itemName}
            >
              {/* <SidebarButton
                active={item.id === selected_id}
                onClick={() => select_item(item.id)}
              >
                <EllipsisOverflow>{item.name}</EllipsisOverflow>
              </SidebarButton> */}
            </ListItem>
            {isBeingDragged && (
              <InsertArea
                listItemIndex={i}
                draggedItemIndex={isBeingDragged.index}
                set_insertIndex={set_insertIndex}
                set_mouse={set_mouse}
              />
            )}
          </>
        ))}
      </List>

      {isBeingDragged && (
        <DragOverlay
          // ref={overlayRef}
          onMouseUp={() => set_isBeingDragged(false)}
          onMouseMove={(e) => set_mouse({ y: e.clientY, x: e.clientX })}
        >
          <DragContainer y={mouse.y} x={mouse.x}>
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
