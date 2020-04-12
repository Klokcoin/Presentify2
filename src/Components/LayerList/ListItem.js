import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components/macro";
import { useGesture } from "react-use-gesture";
import { SidebarButton, EllipsisOverflow } from "../../Workspace";

let Container = styled.div`
  position: relative;
  width: 100%;
  // height: 100%;
  user-select: none; // because this messes with dragging

  :hover {
    box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.55);
    transform: scale(1.05);
    z-index: 99;
  }
`;

let EditableName = styled.input`
  background: none;
  color: white;
  border: none;

  user-select: none;
`;

let TrashContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  padding: 0 0.1rem;

  :hover {
    color: FireBrick;
  }
`;

export const ListItem = ({
  set_is_dragging,
  id,
  name,
  handleDragEnd,
  index,
  active,
  select_item,
  change_itemName,
  remove_item,
}) => {
  let [input, set_input] = useState(name);
  let [disabled, set_disabled] = useState(true);
  let [hover, set_hover] = useState(false);
  let inputRef = useRef(null);

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [x, y] }) => {
        if (down) {
          set_is_dragging({ id, index, x, y });
        }
      },
      onDragEnd: () => handleDragEnd(id, index),
    },
    {
      drag: {
        filterTaps: true,
        axis: "y",
        // swipeDistance: [10, 10],
      },
    }
  );

  useEffect(() => {
    set_input(name);
  }, [name]);

  //default behavoir of the input field is overwritten
  // now it needs to focus after a double click
  useEffect(() => {
    if (!disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  let handleBlur = () => {
    set_disabled(true);
    change_itemName(id, input);
  };

  let handleDoubleClick = () => {
    set_disabled(false);
  };

  let handleEnterPress = (e) => {
    if (e.keyCode === 13) {
      inputRef.current.blur();
    }
  };

  let handleRemove = () => {
    remove_item(id);
  };

  return (
    <Container
      {...bind()}
      onMouseEnter={() => set_hover(true)}
      onMouseLeave={() => set_hover(false)}
    >
      <SidebarButton active={active} onClick={select_item}>
        <div onDoubleClick={handleDoubleClick} style={{ width: "100%" }}>
          {disabled ? (
            <EllipsisOverflow
              style={{
                height: "100%",
                width: "100%",
                position: "relative",
              }}
            >
              {name}

              {hover && (
                <TrashContainer title="Delete layer" onClick={handleRemove}>
                  <i class="fas fa-trash-alt"></i>
                </TrashContainer>
              )}
            </EllipsisOverflow>
          ) : (
            <EditableName
              value={input}
              disabled={disabled}
              onClick={(e) => e.preventDefault()}
              ref={inputRef}
              onBlur={handleBlur}
              onChange={(e) => set_input(e.target.value)}
              onKeyUp={handleEnterPress}
            />
          )}
        </div>
      </SidebarButton>
    </Container>
  );
};
