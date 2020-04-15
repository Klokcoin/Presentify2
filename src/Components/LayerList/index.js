import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import styled, { css } from "styled-components/macro";

import { LayerItem } from "./LayerItem";
import * as R from "ramda";

const BASE_LIST_ID = "baseList";
const GROUP_ITEMS_KEY = "groupItems"; // currently this is determined in Workspace, when a group is created

const ListContainer = styled.div`
  pointer-events: auto; // to re-enable mouseEvents
  background: ${(props) => (props.draggingOver ? "SeaGreen" : null)};
  // padding: 5px;

  min-height: 25px; // make it possible to drag an item into an empty group
`;

const Container = styled.div`
  padding: 5px;
`;

const LayerList = ({
  items,
  set_items,
  selected_id,
  select_item,
  reorder_item,
  remove_item,
  change_item,
}) => {
  // let reversed_items = [...items].reverse();

  let [destinationId, set_destinationId] = useState(null);

  let [focusList, set_focusList] = useState(BASE_LIST_ID);

  // Since we are reversing the array, this way we can get the index in the original, unreversed items (for drag ordering)
  const original_index = React.useCallback(
    (index) => {
      return items;
    },
    [items]
  );
  // const original_index = React.useCallback(
  //   (index) => {
  //     return Math.abs(index - (items.length - 1));
  //   },
  //   [items]
  // );

  const onDragStart = (start, provided) => {
    // NOTE: we can do this bc right now we have draggable/droppable id's === item.id, but they don't _have_ to be equal!
    let { draggableId: item_id } = start;
    select_item(item_id);
    console.log("item_id", item_id);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // don't update items if nothing changed
    if (!destination) return; // dropped outside the layer list
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    )
      return;

    console.log(result);

    // find the breadcrumb trail of INDICES where an id is stored in a list
    // e.g.
    //--------------------
    // ITEMLIST:
    // 0 - groupItems:
    //     0 ─ *item we want to select*
    //     1 - ...etc
    // 1 - ...etc
    //---------------------
    // -> our breadcrumbs:  0 > groupItems > 0

    function findCrumbsOfId(id, list, initialPath) {
      if (id === BASE_LIST_ID) return [];

      for (let i = 0; i < list.length; i += 1) {
        let item = list[i];
        if (item.id === id) {
          return [...initialPath, i, GROUP_ITEMS_KEY];
        } else if (item.groupItems)
          return findCrumbsOfId(id, item.groupItems, [
            ...initialPath,
            i,
            GROUP_ITEMS_KEY,
          ]);
      }

      console.log("couldnt find id:", id);
    }

    let sourcePath = [
      ...findCrumbsOfId(source.droppableId, items, []),
      source.index,
    ];

    let item = R.view(R.lensPath(sourcePath), items);

    // for the new item order we first remove the item from its old position
    let newOrder = R.dissocPath(sourcePath, items);
    // newOrder = Object.values(newOrder);

    // determine the destination path inside of the itemList from which we removed the item
    let destPath = [
      ...findCrumbsOfId(destination.droppableId, newOrder, []),
      // we don't the destination.index here...
    ];

    // create a (potentially nested) itemlist in which we are going to insert the item
    let newItems = Object.values(R.view(R.lensPath(destPath), newOrder)); // ??
    newItems.splice(destination.index, 0, item);

    // finally put the new items at the destination path
    newOrder = R.set(R.lensPath(destPath), newItems, newOrder);
    console.log("newOrder", newOrder);
    set_items(newOrder);
  };

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      // onDragUpdate={onDragUpdate}
    >
      <Container>
        <RecursiveList
          focusList={focusList}
          set_focusList={set_focusList}
          listId={BASE_LIST_ID}
          destinationId={destinationId}
          items={items}
          selected_id={selected_id}
          select_item={select_item} //handleItem
          remove_item={remove_item} //handleItem
          change_item={change_item} //handleItem
        />
      </Container>
    </DragDropContext>
  );
};

const RecursiveList = (props) => {
  let {
    items,
    level,
    listId,
    destinationId,
    selected_id,
    focusList,
    set_focusList,
    ...handleItem
  } = props;
  const [isDropDisabled, set_isDropDisabled] = useState(false);

  // a list will be disabled for dropping items when another list is in focus as a drop target
  useEffect(() => {
    if (!focusList) set_isDropDisabled(false);
    else {
      if (focusList === listId) set_isDropDisabled(false);
      else set_isDropDisabled(true);
    }
  }, [focusList]);

  return (
    <Droppable
      droppableId={listId}
      isDropDisabled={isDropDisabled}
      // isCombineEnabled
    >
      {(provided, snapshot) => {
        return (
          <ListContainer
            ref={provided.innerRef}
            onMouseOver={(e) => {
              e.stopPropagation();
              set_focusList(listId);
            }}
            onMouseLeave={(e) => set_focusList(null)}
            {...provided.droppableProps}
            draggingOver={snapshot.isDraggingOver}
          >
            {items.map((item, index) => {
              // let isGroup = item.groupItems && item.groupItems.length > 0;
              let isGroup = item.groupItems;

              return (
                <LayerItem
                  item={item}
                  index={index}
                  key={item.id}
                  selected={selected_id === item.id}
                  isGroup={isGroup}
                  {...handleItem}
                >
                  {isGroup && (
                    <RecursiveList
                      listId={item.id}
                      items={item.groupItems}
                      selected_id={selected_id}
                      destinationId={destinationId}
                      focusList={focusList}
                      set_focusList={set_focusList}
                      {...handleItem}
                    />
                  )}
                </LayerItem>
              );
            })}
            {provided.placeholder}
          </ListContainer>
        );
      }}
    </Droppable>
  );
};

export default LayerList;
