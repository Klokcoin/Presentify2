import React, { useState, useEffect, useRef } from "react";
import { Draggable } from "react-beautiful-dnd";
import styled, { useTheme } from "styled-components/macro";

import { EllipsisOverflow } from "../../Workspace";
import { Whitespace, Center } from "../../Elements";
import { global_styles } from "../../themes/index";

let styled_if = (predicate) => {
  return (p) => (predicate(p) ? "&" : "&:not(&)");
};

let EditableName = styled.input`
  background: none;
  color: inherit;
  font-family: inherit;
  border: none;
  user-select: none;
  margin: 0;
  padding: 0.5rem 0;

  font-size: inherit;
  flex: 1;
`;

// Replaced SidebarButton with a separate component for layers, b/c of dragging stuff
const Container = styled.div`
  transition: background 200ms;
  cursor: pointer;

  display: flex;
  flex-direction: column;
  align-items: stretch;

  // ${global_styles.textColorPrimary};
  color: ${({ theme }) => theme.interface.text};

  :hover {
    background-color: ${({ theme }) => theme.interface.hover};
    color: white;
  }

  ${styled_if((p) => p.selected)} {
    :before {
      content: "";
      background-color: ${({ theme }) => theme.interface[5]};
      width: 5px;
      height: 100%;
      position: absolute;
    }

    background-color: ${({ theme }) => theme.interface[3]};

    position: sticky;
    top: 0;
    bottom: 0;
    z-index: 1;
  }

  ${styled_if((p) => p.dragging)} {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  }
`;

const NestedListContainer = styled.div`
  width: 100%;
  background-color: #333333;
  padding-left: 1rem;
  pointer-events: none;
`;

let NameContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  padding-right: 0.5rem;
`;

// I renamed this from 'TrashContainer' to 'TrashBin' b/c I was confused abt container meaning an _actual_ container (with children etc)
const Trashbin = styled.div`
  display: none;
  ${NameContainer}:hover & {
    display: flex;
  }

  :hover {
    color: FireBrick;
  }
`;

const Icon = styled.div`
  font-size: 12px;
  flex: 0 0 1.5rem;
  padding-left: 5px;

  /* To make the icon easier to click on, expand and then center yourself inside */
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const LayerItem = ({
  item,
  index,
  children,
  select_items,
  remove_item,
  change_item,
  sheet_view,
}) => {
  const [input_enabled, set_input_enabled] = useState(false);
  const [input, set_input] = useState(item.name);
  const [collapsed, set_collapsed] = useState(true);
  const theme = useTheme();

  return (
    <Draggable draggableId={item.id} index={index} isDropDisabled>
      {(provided, snapshot) => {
        return (
          <Container
            theme={theme}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onDoubleClick={(e) => {
              e.stopPropagation();
              set_input_enabled(true);
            }}
            onClick={(e) => {
              e.stopPropagation();
              select_items([item.id]);
            }}
            dragging={snapshot.isDragging}
            selected={sheet_view.selected_ids.includes(item.id)}
          >
            {input_enabled ? (
              <NameContainer>
                {/* <Icon
                  size={12}
                  style={{
                    color: children ? "inherit" : "transparent",
                    marginLeft: "5px",
                  }}
                  onClick={() => children && set_collapsed(!collapsed)}
                >
                  {collapsed ? (
                    <i className="fas fa-chevron-down"></i>
                  ) : (
                    <i className="fas fa-chevron-right"></i>
                  )}
                </Icon> */}

                <EditableName
                  value={input}
                  ref={(ref) => {
                    if (ref != null) {
                      ref.focus();
                    }
                  }}
                  onBlur={() => {
                    set_input_enabled(false);
                    change_item(item.id, {
                      name: input === "" ? "Unnamed" : input,
                    });
                  }}
                  onChange={(event) => set_input(event.target.value)}
                  onKeyUp={(event) => {
                    // If we pressed the enter key
                    if (event.keyCode === 13) {
                      event.currentTarget.blur();
                    }
                  }}
                />
              </NameContainer>
            ) : (
              <NameContainer>
                <Icon
                  size={12}
                  style={{ color: children ? "inherit" : "transparent" }}
                  onClick={() => children && set_collapsed(!collapsed)}
                >
                  {collapsed ? (
                    <i className="fas fa-chevron-down"></i>
                  ) : (
                    <i className="fas fa-chevron-right"></i>
                  )}
                </Icon>

                <EllipsisOverflow
                  style={{
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    width: "100%",
                  }}
                >
                  {item.name}
                </EllipsisOverflow>

                <Whitespace width="0.5rem" />

                <Trashbin
                  title="Delete layer"
                  onClick={(event) => {
                    remove_item(item.id);
                  }}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <i className="fas fa-trash-alt" />
                </Trashbin>
              </NameContainer>
            )}

            {/* possible recursive list items, when this layer is a layerGroup */}
            {children && collapsed && (
              <>
                <NestedListContainer>{children}</NestedListContainer>
              </>
            )}
          </Container>
        );
      }}
    </Draggable>
  );
};
