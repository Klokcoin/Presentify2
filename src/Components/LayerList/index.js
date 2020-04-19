import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import * as R from "ramda";
import styled, { css } from "styled-components/macro";

import { PresentifyContext } from "../../PresentifyContext";
import { LayerItem } from "./LayerItem";

const BASE_LIST_ID = "baseList";
const GROUP_ITEMS_KEY = "groupItems"; // currently this is determined in Workspace, when a group is created

const ListContainer = styled.div`
  pointer-events: auto; /* to re-enable mouseEvents */
  background: ${(props) => (props.draggingOver ? "SeaGreen" : null)};
  /* padding: 5px; */
  min-height: 25px; /* make it possible to drag an item into an empty group */
`;

const Container = styled.div`
  padding: 5px;
`;

export let MemoLayerList = () => {
  let {
    sheet,
    set_sheet,
    select_item,
    remove_item,
    change_item,
    sheet_view,
  } = React.useContext(PresentifyContext);

  return React.useMemo(() => {
    console.log("He hey hey");
    return (
      <LayerList
        sheet={sheet}
        set_sheet={set_sheet}
        select_item={select_item}
        remove_item={remove_item}
        change_item={change_item}
        sheet_view={sheet_view}
      />
    );
  }, [sheet, sheet_view.selected_id]);
};

const LayerList = ({
  sheet: { items },
  set_sheet,
  select_item,
  remove_item,
  change_item,
  sheet_view,
}) => {
  // let reversed_items = [...items].reverse();

  let [destinationId, set_destinationId] = useState(null);

  let [focusList, set_focusList] = useState(BASE_LIST_ID);

  const onDragStart = (start, provided) => {
    // NOTE: we can do this bc right now we have draggable/droppable id's === item.id, but they don't _have_ to be equal!
    let { draggableId: item_id } = start;
    select_item(item_id);
    // console.log("item_id", item_id);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // don't update items if nothing changed
    if (!destination) {
      return; // dropped outside the layer list
    }
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    ) {
      return;
    }

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
      if (id === BASE_LIST_ID) {
        return [];
      }

      // NOTE For loop? We can do better - DRAL
      for (let i = 0; i < list.length; i += 1) {
        let item = list[i];

        if (item.id === id) {
          return [...initialPath, i, GROUP_ITEMS_KEY];
        } else if (item.groupItems) {
          let result = findCrumbsOfId(id, item.groupItems, [
            ...initialPath,
            i,
            GROUP_ITEMS_KEY,
          ]);
          if (result) return result;
        }
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
    set_sheet((sheet) => ({ ...sheet, items: newOrder }));
  };

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      // onDragUpdate={onDragUpdate}
    >
      <Container>
        <RecursiveList
          remove_item={remove_item}
          change_item={change_item}
          select_item={select_item}
          sheet_view={sheet_view}
          focusList={focusList}
          set_focusList={set_focusList}
          listId={BASE_LIST_ID}
          destinationId={destinationId}
          items={items}
        />
      </Container>
    </DragDropContext>
  );
};

const RecursiveList = (props) => {
  let {
    items,
    listId,
    destinationId,
    selected_id,
    focusList,
    set_focusList,

    select_item,
    remove_item,
    change_item,
    sheet_view,
  } = props;

  // NOTE Instead of having a state that we update from a prop,
  // .... we can "just" have a variable that is derived from the prop - DRAL
  // .... So this:
  // const [isDropDisabled, set_isDropDisabled] = useState(false);
  //
  // // a list will be disabled for dropping items when another list is in focus as a drop target
  // useEffect(() => {
  //   if (!focusList) {
  //     set_isDropDisabled(false);
  //   } else {
  //     if (focusList === listId) {
  //       set_isDropDisabled(false);
  //     } else {
  //       set_isDropDisabled(true);
  //     }
  //   }
  // }, [focusList, listId]);
  // NOTE becomes this:
  let isDropDisabled = focusList !== listId;

  console.log(`sheet_view:`, sheet_view);

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
                  select_item={select_item}
                  remove_item={remove_item}
                  change_item={change_item}
                  sheet_view={sheet_view}
                >
                  {isGroup && (
                    <RecursiveList
                      select_item={select_item}
                      remove_item={remove_item}
                      change_item={change_item}
                      sheet_view={sheet_view}
                      listId={item.id}
                      items={item.groupItems}
                      selected_id={selected_id}
                      destinationId={destinationId}
                      focusList={focusList}
                      set_focusList={set_focusList}
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
