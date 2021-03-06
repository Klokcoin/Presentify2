import React from "react";
import Measure from "react-measure";
import styled, { css } from "styled-components/macro";
import ComponentComponent from "@reach/component-component";

import { YamlViewer } from "./AppComponents/YamlViewer.js";
import { DocumentEvent, Whitespace } from "./Elements.js";
import Canvas from "./Components/Canvas.js";
import { Droptarget } from "./Components/Droptarget.js";
import { DropOverlay } from "./AppComponents/DropOverlay.js";
import { component_map } from "./PresentifyComponents/";
import { MemoLayerList } from "./Components/LayerList/index.js";
import { PresentifyContext } from "./PresentifyContext.js";
import { global_styles } from "./themes/index";

let Sidebar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  z-index: 1;

  ${global_styles.text};
  ${global_styles.backgroundColorMedium};

  &:nth-child(2) {
    box-shadow: 6px 0px 8px rgba(0, 0, 0, 0.14);
  }

  &:last-child {
    box-shadow: -6px 0px 8px rgba(0, 0, 0, 0.14);
  }
`;

let ComponentIcon = styled.div`
  margin: 5px 10px 5px 0;
`;

export let EllipsisOverflow = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
`;

let SidebarTitle = styled.div`
  margin-top: 16px;
  margin-left: 16px;
  ${global_styles.heading}
`;

let SidebarLine = styled.div`
  width: calc(100% - 16px - 16px);
  margin-left: 16px;
  margin-right: 16px;
  border: solid 1px var(--color, black);
`;

export let SidebarButton = styled.div`
  transition: background-color 0.2s;
  cursor: pointer;

  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 8px 16px;

  &:hover {
    background-color: ${({ theme }) => theme.layerList.layer.hoverColor};
  }
`;

export let FilesContext = React.createContext({
  getFile: () => {
    throw new Error(`Need a provider for FilesContext.Consumer`);
  },
});

let BLOBURL = Symbol(
  "The blob url, but only valid in the document it was created in"
);

export let LoadFile = ({ url, children }) => {
  let { getFile } = React.useContext(FilesContext);
  let local_match = url.match(/canvas-local:\/\/(.*)/);
  if (local_match) {
    return (
      <ComponentComponent
        initialState={{}}
        didMount={({ setState }) => {
          let file = getFile(local_match[1]);
          setState({ url: URL.createObjectURL(file.file) });
        }}
        willUnmount={({ state }) => {
          URL.revokeObjectURL(state.url);
        }}
      >
        {({ state }) => (state.url ? children({ url: state.url }) : null)}
      </ComponentComponent>
    );
  } else {
    return children({ url });
  }
};

let Workspace = () => {
  let [clipboard, set_clipboard] = React.useState([]);
  const {
    sheet: { items, files },
    sheet_view: { selected_ids },
    add_file,
    add_item,
    change_item,
    select_items,
    remove_item,
  } = React.useContext(PresentifyContext);

  return (
    <Droptarget
      onDrop={async (e) => {
        let file = e.dataTransfer.items[0].getAsFile();
        let canvas_file = await add_file(file);
        add_item(
          {
            type: "dralletje/image",
            options: {
              url: `canvas-local://${canvas_file.id}`,
            },
          },
          {
            viewportWidth: canvas_file.image.width,
            viewportHeight: canvas_file.image.height,
          }
        );
      }}
    >
      {(is_dragging) => (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "grid",
            gridTemplateColumns: "232px 1fr 232px",
            gridTemplateRows: "100%",
          }}
        >
          <DropOverlay is_dragging={is_dragging} />

          <DocumentEvent
            name="keydown"
            handler={(e) => {
              if (
                e.target.tagName === "INPUT" ||
                e.target.tagName === "TEXTAREA"
              ) {
                return;
              }

              if (e.key === "Escape") {
                select_items([]);
              }

              if (e.key === "Backspace" || e.key === "Delete") {
                if (selected_ids.length > 0) {
                  selected_ids.forEach((e) => remove_item(e));
                }
              }

              if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
                let items = selected_ids.map((id) =>
                  items.find((x) => x.id === id)
                );
                if (items) {
                  // TODO Maybe later, append?
                  items.forEach((item) =>
                    set_clipboard([{ ...item, id: null }])
                  );
                }
              }

              if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
                if (clipboard.length !== 0) {
                  let next_element = {
                    ...clipboard[0],
                    x: clipboard[0].x + clipboard[0].width / 2,
                    y: clipboard[0].y + clipboard[0].height / 2,
                    name: `${clipboard[0].name} Copy`,
                  };
                  add_item(next_element);
                  // NOTE This should never append, but always overwrite
                  set_clipboard([next_element]);
                }
              }
            }}
            passive
          />

          {/* Left sidebar */}
          <Sidebar>
            <SidebarTitle>Add layer</SidebarTitle>
            <Whitespace height={16} />
            <div style={{ flexShrink: 0 }}>
              {Object.entries(component_map).map(([key, comp]) => (
                <SidebarButton onClick={() => add_item({ type: key })}>
                  <ComponentIcon>{comp.icon}</ComponentIcon>
                  <Whitespace width={16} />
                  <EllipsisOverflow>{comp.name}</EllipsisOverflow>
                </SidebarButton>
              ))}
            </div>
            <Whitespace height={16} />

            {/* Layer list */}
            <SidebarLine />

            <SidebarTitle> Layer list </SidebarTitle>

            <div style={{ overflowY: "auto", height: "100%" }}>
              <MemoLayerList />
            </div>
          </Sidebar>

          {/* Canvas */}
          <FilesContext.Provider
            value={{
              getFile: (file_id) => {
                // TODO Need way to load in the file into blob when loading
                let file = files.find((x) => x.id === file_id);
                if (file == null) {
                  throw new Error(`No file found for id '${file_id}'`);
                }
                return file;
              },
            }}
          >
            <Measure bounds>
              {({ measureRef, contentRect }) => (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                  }}
                  ref={measureRef}
                >
                  {contentRect.bounds.height && (
                    <Canvas bounds={contentRect.bounds} items={items} />
                  )}
                </div>
              )}
            </Measure>
          </FilesContext.Provider>

          {/* Right sidebar */}
          <Sidebar>
            <SidebarTitle>Edit layer</SidebarTitle>
            <Whitespace height={50} />
            {selected_ids.length === 1 &&
              items
                .filter((item) => selected_ids.includes(item.id))
                .map((item) => {
                  let component_info = component_map[item.type];

                  return (
                    <div style={{ overflowY: "auto" }}>
                      {component_info.ConfigScreen && (
                        <component_info.ConfigScreen
                          value={item.options}
                          onChange={(options) => {
                            change_item(item.id, {
                              options: {
                                ...item.options,
                                ...options,
                              },
                            });
                          }}
                        />
                      )}
                      <YamlViewer value={item.options} id={item.id} />
                    </div>
                  );
                })}
            <Whitespace height={50} />
          </Sidebar>
        </div>
      )}
    </Droptarget>
  );
};

export default Workspace;
