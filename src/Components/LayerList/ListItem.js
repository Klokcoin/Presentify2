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
  }
`;

let EditableName = styled.input`
  background: none;
  color: white;
  border: none;
`;

export function ListItem(props) {
  let {
    set_isBeingDragged,
    id,
    name,
    handle_dragEnd,
    index,
    active,
    select_item,
  } = props;

  let [input, set_input] = useState("");
  let [disabled, set_disabled] = useState(true);
  let inputRef = useRef(null);

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [x, y] }) => {
        if (down) set_isBeingDragged({ id, index, x, y });
      },
      onDragEnd: () => handle_dragEnd(id, index),
    },
    {
      drag: {
        filterTaps: true,
        axis: "y",
        // swipeDistance: [10, 10],
      },
    }
  );

  //default behavoir of the input field is overwritten
  // now it needs to focus after a double click
  useEffect(() => {
    if (!disabled) inputRef.current.focus();
  }, [disabled]);

  let handleDoubleClick = () => {
    console.log("doudlbe");
    set_disabled(false);
  };

  return (
    <Container {...bind()}>
      <SidebarButton active={active} onClick={select_item}>
        <div onDoubleClick={handleDoubleClick}>
          <EditableName
            value={name}
            disabled={disabled}
            onClick={(e) => e.preventDefault()}
            ref={inputRef}
            onBlur={() => set_disabled(true)}
          />
        </div>
      </SidebarButton>
    </Container>
  );
}
