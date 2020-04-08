import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";
import { useDrag, useGesture } from "react-use-gesture";
import { clamp } from "lodash";

let List = styled.div`
  // position: relative;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  width: 100%;
  overflow: hidden;
  height: 100%;
`;

const ITEM_HEIGHT = 40;

let Container = styled.div`
  position: relative;
  height: ${(props) => props.length * ITEM_HEIGHT}px;
  width: 100%;
  border: 1px solid red;
`;

let PreventMouseEvents = styled.div`
  position: absolute;
  background: rgba(255, 0, 0, 0.5);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  z-index: ${(props) => props.preventBelowZ};
`;

export function LayerList(props) {
  let {
    items,
    selected_id,
    select_item,
    change_itemOrder,
    change_item,
    remove_item,
  } = props;

  let [isBeingDragged, set_isBeingDragged] = useState(false);
  let [insertIndex, set_insertIndex] = useState(null);

  function handle_dragEnd(id, currentIndex) {
    console.log("DRAG_END", isBeingDragged.id, "newIndex", insertIndex);
    if (insertIndex !== null) change_itemOrder(id, insertIndex);
    set_isBeingDragged(false);
  }

  let change_itemName = (id, newName) => {
    change_item(id, { name: newName });
  };

  const bind = useGesture(
    {
      onDragStart: ({ args: [originalIndex, id] }) => {
        console.log("started");
        set_isBeingDragged({ id, originalIndex, y: 0 });
      },
      onDrag: ({ args: [originalIndex, id], down, movement: [, y] }) => {
        const curIndex = originalIndex;
        const curRow = clamp(
          Math.round((curIndex * ITEM_HEIGHT + y) / ITEM_HEIGHT),
          0,
          items.length - 1
        );

        set_isBeingDragged({ id, originalIndex, y });
        change_itemOrder(id, curRow);

        if (!down) set_isBeingDragged(false);
      },
      // onDragEnd: () => {
      //   set_isBeingDragged(false);
      // },
    },
    {
      drag: {
        filterTaps: true,
        axis: "y",
        // swipeDistance: [10, 10],
      },
    }
  );

  return (
    <Container length={items.length}>
      <List>
        {/* THE ITEMS */}
        {items.map((item, i) => {
          let y, z;

          if (isBeingDragged && isBeingDragged.id === item.id) {
            y = isBeingDragged.originalIndex * ITEM_HEIGHT + isBeingDragged.y;
            z = 99;
          } else {
            y = i * ITEM_HEIGHT;
            z = 0;
          }
          return (
            <ListItem
              key={item.id}
              bind={bind}
              y={y}
              z={z}
              id={item.id}
              index={i}
              isBeingDragged={isBeingDragged && isBeingDragged.id === item.id}
              // set_isBeingDragged={set_isBeingDragged}
              handle_dragEnd={handle_dragEnd}
              active={item.id === selected_id}
              select_item={() => select_item(item.id)}
              name={item.name}
              change_itemName={change_itemName}
              remove_item={remove_item}
            ></ListItem>
          );
        })}
        {isBeingDragged && (
          <PreventMouseEvents
            preventBelowZ={50}
            // onMouseEnter={(e) => e.stopPropagation()}
            // onMouseLeave={(e) => e.stopPropagation()}
            // onMouseMove={(e) => e.stopPropagation()}
          ></PreventMouseEvents>
        )}
      </List>
    </Container>
  );
}
