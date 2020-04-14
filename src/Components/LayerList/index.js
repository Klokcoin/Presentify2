import React, { useState, useEffect } from "react";
import styled from "styled-components/macro";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";
import { ListItem } from "./ListItem";
import * as R from "ramda";

let List = styled.div`
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  width: 100%;
  overflow: hidden;
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

const InsertArea = ({
  set_insert_index,
  draggedItemIndex,
  listItemIndex,
  set_mouse,
  crumbs,
  set_insertCrumbs,
}) => {
  let [expand, set_expand] = React.useState(false);

  let is_hovering =
    draggedItemIndex === listItemIndex ||
    draggedItemIndex === listItemIndex + 1;

  let handleMouseOver = () => {
    let index = crumbs[crumbs.length - 1];
    let newCrumbs = [...crumbs];

    if (is_hovering) {
      set_insert_index(null);
      set_insertCrumbs([]);
      set_expand(false);
    } else {
      set_expand(true);
      if (draggedItemIndex > listItemIndex) {
        set_insert_index(listItemIndex + 1);

        newCrumbs[crumbs.length - 1] = index + 1;
        set_insertCrumbs(newCrumbs);
      } else {
        set_insert_index(listItemIndex);

        set_insertCrumbs(newCrumbs);
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
};

export const LayerList = ({
  items,
  selected_id,
  select_item,
  change_itemOrder,
  change_item,
  remove_item,
}) => {
  let [insert_index, set_insert_index] = React.useState(null);
  let [is_dragging, set_is_dragging] = React.useState(false);
  let [insertCrumbs, set_insertCrumbs] = useState([]);
  let [mouse, set_mouse] = React.useState(0);

  const handleDragEnd = (id, current_index) => {
    console.log("DRAG_END", is_dragging.id, "newIndex", insert_index);
    if (insert_index !== null) {
      change_itemOrder(id, insert_index); //old way
      change_order(is_dragging.crumbs, insertCrumbs); //new way
    }

    set_is_dragging(false);
    set_insert_index(null);
  };

  let change_itemName = (id, newName) => {
    change_item(id, { name: newName });
  };

  let change_order = (oldPath, newPath) => {
    console.log("oldPath", oldPath, "newPath", newPath);
    // let lensItem = R.view(R.lensPath(oldPath), items);

    let getIndices = (ids, object) => {
      let indexPath = [];
      let item = ids.reduce((acc, val) => {
        console.log("acc", acc, val);
        let index = acc.indexOf(acc.find((x) => x.id === val));
        indexPath.push(index);
        return acc[index];
      }, object);

      return { item, indexPath: indexPath };
    };

    //first remove item
    // let newOrder = R.set(R.lensPath(oldPath), null, items);

    let oldItem = getIndices(oldPath, items);

    let newOrder = R.dissocPath([oldItem.indexPath], items); // converts array to object wtf...
    newOrder = Object.values(newOrder);
    console.log("new order", newOrder);

    let newItem = getIndices(newPath, newOrder);
    console.log("indexPath", newItem.indexPath);
    let arrayWhereTheItemWillBeInserted = R.view(
      R.lensPath(newItem.indexPath.slice(0, newItem.length - 1)),
      newOrder
    );
    console.log(
      "new",
      [...arrayWhereTheItemWillBeInserted],
      newItem.indexPath[newItem.indexPath.length - 1]
    );
    arrayWhereTheItemWillBeInserted.splice(
      newItem.indexPath[newItem.indexPath.length - 1],
      0,
      oldItem.item
    );

    console.log("old", R.view(R.lensPath([]), items));
    console.log("new", arrayWhereTheItemWillBeInserted);

    // newOrder = R.set(R.lensPath(newPath), lensItem, items);
    //
    // console.log("new wolrd order", newOrder);
  };

  // useEffect(() => {
  //   // console.log("new crumbs", insertCrumbs);
  // }, [insertCrumbs]);

  // Listitem handles dragStart, drag_end
  // Insert area sets newIndex

  return (
    <Container>
      <List>
        {/* {is_dragging && (
          <InsertArea
            listItemIndex={-1}
            draggedItemIndex={is_dragging.index}
            set_insert_index={set_insert_index}
            id="bottomLayerInsert"
            set_mouse={set_mouse}
          />
        )} */}

        {/* THE ITEMS */}
        {
          <RecursiveList
            items={items}
            set_is_dragging={set_is_dragging}
            handleDragEnd={handleDragEnd}
            selected_id={selected_id}
            select_item={select_item}
            is_dragging={is_dragging}
            change_itemName={change_itemName}
            remove_item={remove_item}
            set_mouse={set_mouse}
            set_insert_index={set_insert_index}
            set_insertCrumbs={set_insertCrumbs}
            crumbs={[]}
          />
        }
      </List>

      {is_dragging && (
        <DragOverlay
          // ref={overlayRef}
          onMouseUp={() => set_is_dragging(false)}
          onMouseMove={(e) => set_mouse({ y: e.clientY, x: e.clientX })}
        >
          <DragContainer y={mouse.y} x={mouse.x}>
            {items.map((item) => {
              if (item.id === is_dragging.id) {
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
};

let RecursiveList = (props) => {
  let {
    is_dragging,
    items,
    selected_id,
    select_item,
    set_mouse,
    set_insert_index,
    crumbs,
    set_insertCrumbs,
    ...listItemProps
  } = props;
  return items.map((item, i) => {
    let isGroup = item.groupItems && item.groupItems.length > 0;
    return (
      <>
        <ListItem
          {...listItemProps}
          id={item.id}
          index={i}
          active={item.id === selected_id}
          select_item={() => select_item(item.id)}
          name={item.name}
          groupItems={isGroup ? item.groupItems : false}
          crumbs={[...crumbs, item.id]}
        >
          {isGroup && (
            <RecursiveList
              {...listItemProps}
              items={item.groupItems}
              select_item={select_item}
              is_dragging={is_dragging}
              set_mouse={set_mouse}
              set_insert_index={set_insert_index}
              crumbs={[...crumbs, item.id, "groupItems"]} //'hmmm..... not ideal
              set_insertCrumbs={set_insertCrumbs}
            />
          )}
        </ListItem>
        {/* {insert_index === i && <InsertArea />} */}

        {is_dragging && (
          <InsertArea
            listItemIndex={i}
            draggedItemIndex={is_dragging.index}
            set_insert_index={set_insert_index}
            set_mouse={set_mouse}
            crumbs={[...crumbs, item.id]}
            set_insertCrumbs={set_insertCrumbs}
          />
        )}
      </>
    );
  });
};
