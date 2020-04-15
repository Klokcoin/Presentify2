import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { SidebarButton, EllipsisOverflow } from "../Workspace";
import styled, { css } from "styled-components/macro";
import * as R from "ramda";

const List = styled.div`
  display: flex;
  flex-direction: column;

  // flex-grow: 1;

  background: ${(props) => (props.draggingOver ? "SeaGreen" : null)};
  border: 1px solid red;
  padding: 5px;
`;

let EditableName = styled.input`
  background: none;
  color: white;
  border: none;
  user-select: none;
`;

// I renamed this from 'TrashContainer' to 'TrashBin' b/c I was confused abt container meaning an _actual_ container (with children etc)
const TrashBin = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  padding: 0 0.1rem;

  :hover {
    color: FireBrick;
  }
`;

// Replaced SidebarButton with a separate component for layers, b/c of dragging stuff
const LayerItem = styled.div`
  transition: background-color 0.2s ease-in-out;
  cursor: pointer !important;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 12px 16px;
  transform: none;

  background-color: ${({ dragging, hovering, selected }) => {
    if (hovering || selected) {
      return "hsl(210, 20%, 27%)";
    } else {
      return "hsl(0, 0%, 20%)";
    }
  }};

  ${({ dragging }) =>
    dragging &&
    css`
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
    `};
`;

const NestedListContainer = styled.div`
  width: 100%;
  // border: 1px solid red;
`;

const Layer = ({
  item,
  index,
  select_item,
  remove_item,
  change_item,
  selected,
  children,
  set_draggingOverId,

  isGroup,
}) => {
  const [input_enabled, set_input_enabled] = React.useState(false);
  const [hovering, set_hovering] = React.useState(false);
  const [input, set_input] = React.useState(item.name);

  // let [dragState, set_dragState] = useState({
  //   isDragging: false,
  //   draggingOver: null,
  // });

  let inputRef = React.useRef(null);

  React.useEffect(() => {
    // We have to focus up here (instead of in onDoubleClick) b/c the input only mounts when input_enabled is updated
    if (input_enabled) {
      inputRef.current.focus();
    }
  }, [input_enabled]);

  // useEffect(() => {}, [dragState]);

  return (
    <Draggable draggableId={item.id} index={index} isDropDisabled>
      {(provided, snapshot) => {
        return (
          <LayerItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onDoubleClick={() => set_input_enabled(true)}
            onClick={() => select_item(item.id)}
            onMouseEnter={() => set_hovering(true)}
            onMouseLeave={() => set_hovering(false)}
            dragging={snapshot.isDragging}
            hovering={hovering}
            selected={selected}
          >
            {input_enabled ? (
              <EditableName
                value={input}
                disabled={!input_enabled}
                onClick={(e) => e.preventDefault()}
                ref={inputRef}
                onBlur={() => {
                  set_input_enabled(false);
                  change_item(item.id, { name: input });
                }}
                onChange={(event) => set_input(event.target.value)}
                onKeyUp={(event) => {
                  // If we pressed the enter key
                  if (event.keyCode === 13) {
                    inputRef.current.blur();
                  }
                }}
              />
            ) : (
              <EllipsisOverflow
                style={{
                  height: "100%",
                  width: "100%",
                  position: "relative",
                }}
              >
                {item.name}

                {hovering && (
                  <TrashBin
                    title="Delete layer"
                    onClick={(event) => {
                      event.preventDefault();
                      remove_item(item.id);
                    }}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </TrashBin>
                )}
              </EllipsisOverflow>
            )}

            {/* possible recursive list items, when this layer is a layerGroup */}

            {children && <NestedListContainer>{children}</NestedListContainer>}
          </LayerItem>
        );
      }}
    </Draggable>
  );
};

const LayerList = ({
  items,
  set_items,
  selected_id,
  select_item,
  reorder_item,
  remove_item,
  change_item,
}) => {
  let reversed_items = [...items].reverse();
  // let reversed_items = [...items].reverse();

  let [destinationId, set_destinationId] = useState(null);

  let [focusList, set_focusList] = useState("base_list");

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

  // const onDragUpdate = (update) => {
  //   let { combine, source, destination } = update;

  //   // can change a destination list when trying to combine
  //   if (combine) {
  //     // console.log("combine", update);
  //     // console.log("tree", groupTree);

  //     let { draggableId } = combine;

  //     //check if the item is combinable
  //     let combinable = groupTree[draggableId].isGroup;
  //     if (combinable) set_destinationId(draggableId);
  //   } else {
  //     // console.log("uncombine", update);

  //     if (destination) set_destinationId(destination.droppableId);
  //   }
  // };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // don't update items if nothing changed
    if (!destination) return;
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    )
      return;

    console.log("sroucce", source, "dest", destination);
    // dropped outside the layer list
    if (!destination) {
      return;
    }

    // let oldIndex = original_index(source.index);
    // let newIndex = original_index(destination.index);
    let oldIndex = source.index;
    let newIndex = destination.index;

    // don't update items if nothing changed
    // if (oldIndex === newIndex) {
    //   return;
    // }

    function findPathForId(resultObj, path, list) {
      let { index, droppableId } = resultObj;

      // let invertedIndex = Math.abs(index - (list.length - 1));

      if (droppableId === "base_list") return [index];

      for (let i = 0; i < list.length; i += 1) {
        // let iinverted = Math.abs(i - (list.length - 1)); //??????????
        let item = list[i];
        if (item.id === droppableId) {
          return [...path, i, "groupItems", index];
        } else if (item.groupItems)
          return findPathForId(
            resultObj,
            [...path, i, "groupItems"],
            item.groupItems
          );
      }

      console.log("couldnt find id:", droppableId);
    }

    let sourcePath = findPathForId(source, [], items);
    // console.log("from", from, "to", to);
    // console.log("flat", flat);

    let item = R.view(R.lensPath(sourcePath), items);
    //first remove at old position
    let newOrder = R.dissocPath(sourcePath, items);
    newOrder = Object.values(newOrder);

    // console.log("sourcePath", sourcePath);
    // console.log("item", item);
    console.log("og", JSON.parse(JSON.stringify(items)));
    console.log("-source", newOrder);

    let destPath = findPathForId(destination, [], newOrder);
    // console.log("destPath", destPath);

    let insertPath = destPath.slice(0, destPath.length - 1);
    console.log("insert", insertPath, "dest", destPath);

    //view items in itemgroup
    let newItems = Object.values(R.view(R.lensPath(insertPath), newOrder));
    console.log("new items 1", newItems);
    let lastIndex = destPath[destPath.length - 1];
    console.log("added item", item, lastIndex);

    //insert item in itemgroup
    // let jo = [...newItems].splice(destPath[destPath.length - 1], 0, item);

    newItems.splice(lastIndex, 0, item);

    let finalOrder = R.set(R.lensPath(insertPath), newItems, newOrder);
    console.log("+dest", finalOrder, typeof finalOrder);

    // reorder_item(oldIndex, newIndex);

    set_items(finalOrder);
  };

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      // onDragUpdate={onDragUpdate}
    >
      <RecursiveList
        level={0}
        focusList={focusList}
        set_focusList={set_focusList}
        listId="base_list"
        destinationId={destinationId}
        items={items}
        selected_id={selected_id}
        select_item={select_item} //handleItem
        remove_item={remove_item} //handleItem
        change_item={change_item} //handleItem
      />
    </DragDropContext>
  );
};

let RecursiveList = (props) => {
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

  // useEffect(() => {
  //   // let { dragId, dropId } = combineState;

  //   if (!destinationId) set_isDropDisabled(false);
  //   else {
  //     if (destinationId === listId) set_isDropDisabled(false);
  //     else set_isDropDisabled(true);
  //   }
  // }, [destinationId]);

  useEffect(() => {
    // let { dragId, dropId } = combineState;

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
      style={{ position: "absolute", zIndex: level || 0 }}
    >
      {(provided, snapshot) => {
        return (
          <List
            style={{ pointerEvents: "auto" }} // to re-enable mouseEvents
            onMouseOver={(e) => {
              // console.log("over ", listId);
              e.stopPropagation();
              set_focusList(listId);
            }}
            onMouseLeave={(e) => {
              // e.stopPropagation();
              set_focusList(null);
            }}
            ref={provided.innerRef}
            {...provided.droppableProps}
            draggingOver={snapshot.isDraggingOver}
            level={level || 0}
          >
            {items.map((item, index) => {
              let isGroup = item.groupItems && item.groupItems.length > 0;

              return (
                <Layer
                  item={item}
                  index={index}
                  key={item.id}
                  selected={selected_id === item.id}
                  isGroup={isGroup}
                  {...handleItem}
                >
                  {isGroup && (
                    <RecursiveList
                      level={level + 15000}
                      listId={item.id}
                      items={item.groupItems}
                      selected_id={selected_id}
                      destinationId={destinationId}
                      focusList={focusList}
                      set_focusList={set_focusList}
                      {...handleItem}
                    />
                  )}
                </Layer>
              );
            })}
            {provided.placeholder}
          </List>
        );
      }}
    </Droppable>
  );
};

export default LayerList;
