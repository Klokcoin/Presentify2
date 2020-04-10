import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";
import { useDrag, useGesture } from "react-use-gesture";
import { useSprings, animated, useTransition } from "react-spring";
import { clamp } from "lodash";

let List = styled.div`
  position: absolute;
  display: flex;
  // flex-direction: column-reverse;
  // justify-content: flex-end;
  width: 100%;
  // overflow-x: hidden;
  height: 100%;
  z-index: 0;
`;

const ITEM_HEIGHT = 40;

let Container = styled.div`
  position: relative;
  height: ${(props) => props.length * ITEM_HEIGHT}px;
  width: 100%;
  border: 1px solid red;
`;

const AnimatedListItem = styled(animated.div)`
  position: absolute;

  left: 0;
  width: 100%;
  height: ${ITEM_HEIGHT}px;
  background: ${(props) => (props.isBeingDragged ? "lightgrey" : "none")};
  top: ${(props) => props.y || 100}px;
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

  let [localOrder, set_localOrder] = useState(
    items.map((item, index) => ({ ...item, y: index * ITEM_HEIGHT }))
  );

  useEffect(() => {
    set_localOrder(
      items.map((item, index) => ({
        ...item,
        listY: index * ITEM_HEIGHT,
        isBeingDragged: false,
      }))
    );
  }, [items]);

  let change_itemName = (id, newName) => {
    change_item(id, { name: newName });
  };

  const bind = useDrag(
    ({ args: [originalIndex, id], down, movement: [, y] }) => {
      const curIndex = localOrder.indexOf(localOrder.find((x) => x.id === id));
      const curRow = clamp(
        Math.round((curIndex * ITEM_HEIGHT + y) / ITEM_HEIGHT),
        0,
        localOrder.length - 1
      );
      const newOrder = swap(localOrder, curIndex, curRow);

      let newLocalOrder = localOrder.map((item, index) => {
        let newY, isBeingDragged;

        if (id === item.id) {
          newY = index * ITEM_HEIGHT + y;
          isBeingDragged = true;
        } else {
          newY = newOrder.indexOf(localOrder[index]) * ITEM_HEIGHT;
          isBeingDragged = false;
        }

        return { id: item.id, name: item.name, listY: newY, isBeingDragged };
      });

      console.log("new local ordre", newLocalOrder);

      set_localOrder([...newLocalOrder]);

      if (!down) {
        set_localOrder(newOrder);
        change_itemOrder(newOrder.map((x) => x.id));
        select_item(id);
      }
    }
  );

  return (
    <Container
      length={items.length}
      // onMouseDown={() => set_dragEnabled(true)}
      // onMouseUp={() => set_dragEnabled(false)}
    >
      <DragOverlay>
        {items.map(({ id }, i) => (
          <HandleDrag key={id} {...bind(i, id)} y={i * ITEM_HEIGHT} />
        ))}
      </DragOverlay>

      <AnimatedList localOrder={localOrder} />
    </Container>
  );
}

let DragOverlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  z-index: 999;
`;

let HandleDrag = styled.div`
  position: absolute;
  top: ${(props) => props.y}px;
  // background: rgba(50, 50, 0, 0.5);
  height: ${ITEM_HEIGHT}px;
  width: 100%;
  user-select: none;
`;

function swap(currentOrder, from, to) {
  let swappedItem = currentOrder[from];
  let reOrdered_items = [...currentOrder];
  reOrdered_items.splice(from, 1);
  reOrdered_items.splice(to, 0, swappedItem);

  return reOrdered_items;
}

let AnimatedList = (props) => {
  let { localOrder, set_draggedItem, set_localOrder } = props;

  //animated styles
  let style = (y) => ({
    y,
    z: 1,
    opacity: 1,
    shadow: 0,
    scale: 1,
  });

  let dragStyle = (y) => ({
    y,
    z: 2,
    opacity: 1,
    shadow: 1,
    scale: 1.05,
  });

  const transitions = useTransition(
    // localOrder.map((item, i) => ({ ...item, listY: i * ITEM_HEIGHT })),
    localOrder,
    (item) => item.id,
    {
      from: { opacity: 0 },
      leave: { opacity: 0 },
      enter: ({ listY, isBeingDragged }) =>
        isBeingDragged ? dragStyle(listY) : style(listY),

      update: ({ listY, isBeingDragged }) =>
        isBeingDragged ? dragStyle(listY) : style(listY),
    }
  );

  return (
    <List>
      {/* THE ITEMS */}

      {transitions.map(({ item, props }, i) => {
        let { y, z, opacity, shadow, scale, background } = props;
        let { isBeingDragged } = item;

        return (
          <AnimatedListItem
            key={item.id}
            style={{
              top: y,
              zIndex: z,
              opacity,
              boxShadow: shadow.interpolate(
                (s) =>
                  `rgba(0, 0, 0, ${0.75 * s}) 0px 0px ${14 * s}px ${2 * s}px `
              ),
              transform: scale.interpolate((s) => `scale(${s})`),
            }}
            isBeingDragged={isBeingDragged}
          >
            <ListItem
              id={item.id}
              index={i}
              // active={item.id === selected_id}
              // select_item={() => select_item(item.id)}
              name={item.name}
              // change_itemName={change_itemName}
              // remove_item={remove_item}
            ></ListItem>
          </AnimatedListItem>
        );
      })}
    </List>
  );
};
