import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { SidebarButton, EllipsisOverflow } from "../Workspace";
import styled, { css } from "styled-components/macro";

const List = styled.div`
  display: flex;
  flex-direction: column;
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
  flex-direction: row;
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

const Layer = ({
  item,
  index,
  select_item,
  remove_item,
  change_item,
  selected,
}) => {
  const [input_enabled, set_input_enabled] = React.useState(false);
  const [hovering, set_hovering] = React.useState(false);
  const [input, set_input] = React.useState(item.name);
  let inputRef = React.useRef(null);

  React.useEffect(() => {
    // We have to focus up here (instead of in onDoubleClick) b/c the input only mounts when input_enabled is updated
    if (input_enabled) {
      inputRef.current.focus();
    }
  }, [input_enabled]);

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
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
        </LayerItem>
      )}
    </Draggable>
  );
};

const LayerList = ({
  items,
  selected_id,
  select_item,
  reorder_item,
  remove_item,
  change_item,
}) => {
  let reversed_items = [...items].reverse();

  // Since we are reversing the array, this way we can get the index in the original, unreversed items (for drag ordering)
  const original_index = React.useCallback(
    (index) => {
      return Math.abs(index - (items.length - 1));
    },
    [items]
  );

  const onDragStart = (start, provided) => {
    // NOTE: we can do this bc right now we have draggable/droppable id's === item.id, but they don't _have_ to be equal!
    let { draggableId: item_id } = start;
    select_item(item_id);
    console.log("item_id", item_id);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    // dropped outside the layer list
    if (!destination) {
      return;
    }

    let oldIndex = original_index(source.index);
    let newIndex = original_index(destination.index);

    // don't update items if nothing changed
    if (oldIndex === newIndex) {
      return;
    }

    reorder_item(oldIndex, newIndex);
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Droppable droppableId="layer_list">
        {(provided) => (
          <List ref={provided.innerRef} {...provided.droppableProps}>
            {reversed_items.map((item, index) => (
              <Layer
                item={item}
                index={index}
                key={item.id}
                select_item={select_item}
                remove_item={remove_item}
                change_item={change_item}
                selected={selected_id === item.id}
              />
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default LayerList;
