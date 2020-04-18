import React from "react";
import { DocumentEvent } from "../Elements.js";

// NOTE This is hacky as fuuuuuck
// .... But still, I really like it.
// .... Couple of potential problems:
// .... 1. This also changes the pageX and pageY for listeners higher up.
// ....    I would have loved to do something where it doesn't even bubble up
// ....    to listeners higher up, but I can't because I use <DocumentEvent />
// ....    in <Draggable />, and there is no way to know "where" a <DocumentEvent />
// ....    was initially registered.
// .... 2. I had the idea I had a whole list but I don't but there sure are potential problems,
// ....    so just add them as you find them (or fix them, HOW ABOUT THAT E)

let fixup_react_event = (mapCoords, e) => {
  // TODO Cache this, and maybe only call it if pageX and pageY are actuall requested?
  let page = mapCoords({
    x: e.pageX,
    y: e.pageY,
  });

  let client = mapCoords({
    x: e.clientX,
    y: e.clientY,
  });

  let type = e.type;

  // TODO More than just pageX and pageY
  Object.defineProperty(e, "pageX", {
    get: () => {
      return page.x;
    },
  });
  Object.defineProperty(e, "pageY", {
    get: () => page.y,
  });
  Object.defineProperty(e, "clientX", {
    get: () => {
      return client.x;
    },
  });
  Object.defineProperty(e, "clientY", {
    get: () => client.y,
  });

  if (e.nativeEvent) {
    Object.defineProperty(e.nativeEvent, "pageX", {
      get: () => {
        return page.x;
      },
    });
    Object.defineProperty(e.nativeEvent, "pageY", {
      get: () => page.y,
    });
    Object.defineProperty(e.nativeEvent, "clientX", {
      get: () => {
        return page.x;
      },
    });
    Object.defineProperty(e.nativeEvent, "clientY", {
      get: () => page.y,
    });
  }
};

export const IsolateCoordinatesForElement = ({ element, mapCoords }) => {
  let currently_mousedown_in_my_hood = React.useRef(false);

  let path = (event) => {
    return event.path || event.composedPath?.();
  };

  return (
    <>
      <DocumentEvent
        // So `capture` makes it so this event is taken before it is even really an event
        // https://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2017/05/1495534508eventflow.svg
        capture
        passive
        name="mousedown"
        handler={(e) => {
          if (path(e).includes(element)) {
            currently_mousedown_in_my_hood.current = true;
            fixup_react_event(mapCoords, e);
          }
        }}
      />
      <DocumentEvent
        capture
        passive
        name="mousemove"
        handler={(e) => {
          if (
            currently_mousedown_in_my_hood.current ||
            path(e).includes(element)
          ) {
            fixup_react_event(mapCoords, e);
          }
        }}
      />
      <DocumentEvent
        capture
        passive
        name="mouseup"
        handler={(e) => {
          if (
            currently_mousedown_in_my_hood.current ||
            path(e).includes(element)
          ) {
            currently_mousedown_in_my_hood.current = false;
            fixup_react_event(mapCoords, e);
          }
        }}
      />
      <DocumentEvent
        capture
        passive
        name="wheel"
        handler={(e) => {
          fixup_react_event(mapCoords, e);
        }}
      />
    </>
  );
};
