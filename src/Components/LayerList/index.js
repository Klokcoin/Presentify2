import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";
import { useDrag, useGesture } from "react-use-gesture";
import { clamp } from "lodash";

let List = styled.div`
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  width: 100%;
  overflow-x: hidden;
`;

const ITEM_HEIGHT = 50;

let Container = styled.div`
  position: relative;
  height: ${(props) => props.length + ITEM_HEIGHT};
`;

export function LayerList(props) {
  let {
    items,
    selected_id,
    select_item,
    change_itemOrder,
    change_item,
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
          Math.round((curIndex * 100 + y) / 100),
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
              // set_isBeingDragged={set_isBeingDragged}
              handle_dragEnd={handle_dragEnd}
              active={item.id === selected_id}
              select_item={() => select_item(item.id)}
              name={item.name}
              change_itemName={change_itemName}
            ></ListItem>
          );
        })}
      </List>
    </Container>
  );
}
