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

let DetectAbove = styled.div`
  z-index: 99;
  position: absolute;
  top: 0;
  height: 10px;
  width: 100%;
  // background: tomato;
`;
let DetectBelow = styled.div`
  z-index: 99;
  position: absolute;
  bottom: 0;
  height: 10px;
  width: 100%;
  // background: lightblue;
`;

let InsertArea = styled.hr`
  border-top: 4px dashed red;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
`;

export function LayerList(props) {
  let { items, selected_id, select_item, change_itemOrder } = props;

  let [isBeingDragged, set_isBeingDragged] = useState(false);
  let [mouseY, set_mouseY] = useState(0);
  let [insertIndex, set_insertIndex] = useState(null);
  // let overlayRef = useRef(null);

  // useEffect(() => {
  //   if (!isBeingDragged) {
  //     change_itemOrder(isBeingDragged.id, insertIndex);
  //     set_insertIndex(null);
  //   }
  // }, [isBeingDragged]);

  // let handleMouseMove = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   let newOffset = e.pageY - overlayRef.current.getBoundingClientRect().top;
  //   set_yOffset(newOffset);
  // };

  function handle_dragEnd(id, currentIndex) {
    // console.log("DRAG_END", isBeingDragged.id);
    if (currentIndex !== insertIndex) change_itemOrder(id, insertIndex);
    set_insertIndex(null);
    set_isBeingDragged(false);
  }

  return (
    <Container>
      <List>
        {items.map((item, i) => (
          <>
            {insertIndex === i && <InsertArea />}

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

              {/* {i === items.length - 1 && insertIndex >= items.length && (
                <>
                  <InsertArea />
                </>
              )} */}

              {/* create hitboxes when another item is being dragged */}
              {isBeingDragged && (
                <>
                  <DetectAbove
                    onMouseEnter={() => {
                      console.log(
                        "drag:",
                        isBeingDragged.index,
                        "current",
                        i + 1
                      );
                      if (i + 1 !== isBeingDragged.index)
                        set_insertIndex(i + 1);
                      else set_insertIndex(null);
                    }}
                  />
                  <DetectBelow
                    onMouseEnter={() => {
                      console.log("drag:", isBeingDragged.index, "current", i);
                      if (i - 1 !== isBeingDragged.index) set_insertIndex(i);
                      else set_insertIndex(null);
                    }}
                  />
                </>
              )}
            </ListItem>
          </>
        ))}
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
