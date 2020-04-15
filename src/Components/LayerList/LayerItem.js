import React, { useState, useEffect } from "react";
import { Draggable } from "react-beautiful-dnd";
import { EllipsisOverflow } from "../../Workspace";
import styled, { css } from "styled-components/macro";

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
const Container = styled.div`
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

export const LayerItem = ({
  item,
  index,
  select_item,
  remove_item,
  change_item,
  selected,
  children,
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
    <Draggable draggableId={item.id} index={index} isDropDisabled>
      {(provided, snapshot) => {
        return (
          <Container
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
          </Container>
        );
      }}
    </Draggable>
  );
};
