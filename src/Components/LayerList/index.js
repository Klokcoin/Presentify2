import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";
import { useDrag, useGesture } from "react-use-gesture";
import { useSprings, animated } from "react-spring";
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

const AnimatedListItem = styled(animated.div)`
  position: absolute;

  left: 0;
  width: 100%;
  height: ${ITEM_HEIGHT}px;
  // background: green;
`;

const fn = (order, down, originalIndex, curIndex, y) => (index) =>
  down && index === originalIndex
    ? {
        y: curIndex * ITEM_HEIGHT + y,
      }
    : {
        y: order.indexOf(index) * ITEM_HEIGHT,
      };

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
  const order = useRef(items.map((_, index) => index)); // Store indicies as a local ref, this represents the item order

  useEffect(() => {
    order.current = items.map((_, index) => index);
  }, [items]);

  function handle_dragEnd(id, currentIndex) {
    console.log("DRAG_END", isBeingDragged.id, "newIndex", insertIndex);
    if (insertIndex !== null) change_itemOrder(id, insertIndex);
    set_isBeingDragged(false);
  }

  let change_itemName = (id, newName) => {
    change_item(id, { name: newName });
  };

  function swap(currentOrder, from, to) {
    console.log("swap", currentOrder, from, to);

    // return currentOrder;

    let swappedItem = currentOrder[from];
    // console.log("swappedItem", swappedItem);

    let reOrdered_items = [...currentOrder];
    reOrdered_items.splice(from, 1);
    reOrdered_items.splice(to, 0, swappedItem);

    return reOrdered_items;
  }

  const [springs, setSprings] = useSprings(items.length, fn(order.current)); // Create springs, each corresponds to an item, controlling its transform, scale, etc.
  const bind = useDrag(({ args: [originalIndex], down, movement: [, y] }) => {
    console.log("draggin");
    const curIndex = order.current.indexOf(originalIndex);
    const curRow = clamp(
      Math.round((curIndex * ITEM_HEIGHT + y) / ITEM_HEIGHT),
      0,
      items.length - 1
    );
    const newOrder = swap(order.current, curIndex, curRow);
    setSprings(fn(newOrder, down, originalIndex, curIndex, y)); // Feed springs new style data, they'll animate the view without causing a single render
    if (!down) {order.current = newOrder;
    change_itemOrder(items[originalIndex].id)};
  });

  return (
    <Container length={items.length}>
      <List>
        {/* THE ITEMS */}

        {springs.map(({ zIndex, shadow, y, scale }, i) => {
          let item = items[i];

          return (
            <AnimatedListItem {...bind(i)} key={i} style={{ top: y }}>
              <ListItem
                id={item.id}
                index={i}
                active={item.id === selected_id}
                select_item={() => select_item(item.id)}
                name={item.name}
                change_itemName={change_itemName}
                remove_item={remove_item}
              ></ListItem>
            </AnimatedListItem>
          );
        })}
        {/* {items.map((item, i) => {
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
        })} */}
        {/* {isBeingDragged && (
          <PreventMouseEvents
            preventBelowZ={50}
            // onMouseEnter={(e) => e.stopPropagation()}
            // onMouseLeave={(e) => e.stopPropagation()}
            // onMouseMove={(e) => e.stopPropagation()}
          ></PreventMouseEvents>
        )} */}
      </List>
    </Container>
  );
}
