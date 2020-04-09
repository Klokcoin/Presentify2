import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";
import { useDrag, useGesture } from "react-use-gesture";
import { useSprings, animated, useTransition } from "react-spring";
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
  // top: ${(props) => props.y || 100}px;
`;

function swap(currentOrder, from, to) {
  let swappedItem = currentOrder[from];
  let reOrdered_items = [...currentOrder];
  reOrdered_items.splice(from, 1);
  reOrdered_items.splice(to, 0, swappedItem);

  return reOrdered_items;
}

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
  const order = useRef(items.map((i, index) => i.id)); // Store indicies as a local ref, this represents the item order
  let [localOrder, set_localOrder] = useState(
    items.map((item, index) => ({ ...item, y: index * ITEM_HEIGHT }))
  );

  let [draggedItem, set_draggedItem] = useState(0);

  useEffect(() => {
    order.current = items.map((i, index) => i.id);
    set_localOrder(
      items.map((item, index) => ({
        ...item,
        listY: index * ITEM_HEIGHT,
        listZ: 0,
      }))
    );
    // setSprings(fn(order.current, order.current));
  }, [items]);

  useEffect(() => {
    console.log("local", localOrder);
  }, [localOrder]);

  let change_itemName = (id, newName) => {
    change_item(id, { name: newName });
  };

  let transitions = useTransition(localOrder, (item) => item.id, {
    from: { opacity: 0 },
    leave: { opacity: 0 },
    enter: ({ listY, listZ }) => ({ y: listY, z: listZ, opacity: 1 }),
    update: ({ listY, listZ }) => ({ y: listY, z: listZ }),
  });

  const bind = useGesture({
    onDragStart: () => {},
    onDrag: ({ args: [originalIndex, id], down, movement: [, y] }) => {
      const curIndex = localOrder.indexOf(localOrder.find((x) => x.id === id));
      const curRow = clamp(
        Math.round((curIndex * ITEM_HEIGHT + y) / ITEM_HEIGHT),
        0,
        items.length - 1
      );
      const newOrder = swap(localOrder, curIndex, curRow);

      let newLocalOrder = items.map((item, index) => {
        let newY, newZ;

        if (id === item.id) {
          newY = curRow * ITEM_HEIGHT + y;
          newZ = 99;
          console.log("newy", newY);
        } else {
          newY = newOrder.indexOf(localOrder[index]) * ITEM_HEIGHT;
          newZ = 0;
        }

        return { id: item.id, listY: newY, listZ: newZ };
      });

      set_localOrder([...newLocalOrder]);

      if (!down) {
        change_itemOrder(newOrder.map((x) => x.id));
        select_item(id);
      }
    },
  });

  return (
    <Container length={items.length}>
      <List>
        {/* THE ITEMS */}

        {transitions.map(({ item, props }, i) => {
          // let item = items[i];

          // console.log("jo", props);
          return (
            <AnimatedListItem
              key={item.id}
              // y={props.y}
              style={{ top: props.y, zIndex: props.z, opacity: props.opacity }}
            >
              <div {...bind(i, item.id)}>
                <ListItem
                  id={item.id}
                  index={i}
                  active={item.id === selected_id}
                  select_item={() => select_item(item.id)}
                  name={item.name}
                  change_itemName={change_itemName}
                  remove_item={remove_item}
                ></ListItem>
              </div>
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
      dragged: {draggedItem}
    </Container>
  );
}
