import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { useGesture, useDrag } from "react-use-gesture";
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
  // border: solid green 1px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: grabbing;
`;

let DragContainer = styled.div`
  width: 100%;
  // height: 50px;
  position: fixed;
  top: ${(props) => props.y - 5}px;
  left: 0;
  opacity: 50%;

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
  background: rgba(255, 0, 0, 0.1);

  :hover {
    height: ${2 * HITBOX_PADDING + HITBOX_HEIGHT}px;
  }
`;
let DetectBelow = styled.div`
  z-index: 99;
  position: absolute;
  bottom: 0;
  height: 10px;
  width: 100%;
  background: lightblue;
`;

// let InsertArea = styled.hr`
//   border-top: 4px dashed red;
//   width: 100%;
//   padding: 10px;
//   box-sizing: border-box;
// `;

let HitboxContainer = styled.div`
  width: 100%;
  height: ${(props) => (props.expand ? HITBOX_HEIGHT + "px" : "0px")};
  position: relative;
  background: coral;
  transition: height 0.15s;
  transition-timing-function: ease;
`;

function InsertArea(props) {
  let { set_insertIndex, draggedItemIndex, listItemIndex } = props;
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
      ></DetectAbove>
    </HitboxContainer>
  );
}

export function LayerList(props) {
  let { items, selected_id, select_item, change_itemOrder } = props;

  let [isBeingDragged, set_isBeingDragged] = useState(false);
  let [mouseY, set_mouseY] = useState(0);
  let [insertIndex, set_insertIndex] = useState(null);

  function handle_dragEnd(id, currentIndex) {
    console.log("DRAG_END", isBeingDragged.id, "newIndex", insertIndex);
    if (insertIndex !== null) change_itemOrder(id, insertIndex);
    set_isBeingDragged(false);
    set_insertIndex(null);
  }

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
            >
              <SidebarButton
                active={item.id === selected_id}
                onClick={() => select_item(item.id)}
              >
                <EllipsisOverflow>{item.name}</EllipsisOverflow>
              </SidebarButton>

              {/* create hitboxes when another item is being dragged */}
              {/* {isBeingDragged && (
                <DetectAbove
                  onMouseEnter={() => {
                    console.log("drag:", isBeingDragged.index, "current", i);

                    if (isBeingDragged.index < i) {
                      if (isBeingDragged.index + 1 === i) set_insertIndex(null);
                      else set_insertIndex(i - 1);
                    } else if (isBeingDragged.index > i) set_insertIndex(i);
                    else set_insertIndex(null);
                  }}
                />
              )} */}
            </ListItem>
            {isBeingDragged && (
              <InsertArea
                listItemIndex={i}
                draggedItemIndex={isBeingDragged.index}
                set_insertIndex={set_insertIndex}
              />
            )}
          </>
        ))}
        {/* <DetectBelow
          onMouseEnter={() => {
            let i = items.length - 1;
            console.log("drag:", isBeingDragged.index, "current", i);
            if (i !== isBeingDragged.index) set_insertIndex(i + 1);
            else set_insertIndex(null);
          }}
        />
        {isBeingDragged && insertIndex >= items.length && (
          <>
            <InsertArea />
          </>
        )} */}
      </List>

      {isBeingDragged && (
        <DragOverlay
          // ref={overlayRef}
          onMouseUp={() => set_isBeingDragged(false)}
          onMouseMove={(e) => set_mouseY(e.clientY)}
        >
          y:{isBeingDragged.y}
          id:{isBeingDragged.index}
          <DragContainer y={mouseY}>
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
  position: relative;
  width: 100%;
  height: 100%;
  border: ${(props) => (props.mouseDown ? "solid 1px green" : "")};
  user-select: none; // because this messes with dragging
  border-top: 1px solid green;
  border-bottom: 1px solid green;
`;

export function ListItem(props) {
  let { set_isBeingDragged, id, children, handle_dragEnd, index } = props;
  let [mouseDown, set_mouseDown] = useState(false);
  // const bind = useDrag(({ down, offset: [x, y] }) =>
  //   set_isBeingDragged({ id, x, y })
  // );

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [x, y] }) => {
        if (down) {
          set_isBeingDragged({ id, index, x, y });
          set_mouseDown(true);
        }
      },
      onDragEnd: () => {
        // console.log("DRAG_END1", id);
        handle_dragEnd(id, index);
        set_mouseDown(false);
      },
      // onDragStart: state => doSomethingWith(state),
    },
    {
      drag: {
        axis: "y",
        swipeDistance: [10, 10],
      },
    }
  );

  return (
    <LayerListItemContainer
      // mouseDown={mouseDown}
      {...bind()}
      // onMouseUp={() => set_isBeingDragged(null)}
    >
      {children}
    </LayerListItemContainer>
  );
}
