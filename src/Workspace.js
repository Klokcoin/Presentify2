import React from "react";
import Measure from "react-measure";
import styled, { useTheme, css } from "styled-components/macro";
import ComponentComponent from "@reach/component-component";

import { YamlViewer } from "./AppComponents/YamlViewer.js";
import { DocumentEvent, Whitespace, Layer } from "./Elements.js";
import Canvas from "./Components/Canvas.js";
import { Droptarget } from "./Components/Droptarget.js";
import { DropOverlay } from "./AppComponents/DropOverlay.js";
import { component_map } from "./PresentifyComponents/";
import { MemoLayerList } from "./Components/LayerList/index.js";
import { PresentifyContext } from "./PresentifyContext.js";
import { global_styles } from "./themes/index";
import { Toolbox } from "./Components/Toolbox";

const InterfaceLayout = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: minmax(0, 1fr) 15rem;
  width: 100%;
  height: 100%;

  position: relative;
`;

let Sidebar = styled.div`
  pointer-events: auto;
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  z-index: 1;
  position: relative;
  grid-column: 2;
  grid-row: 1 / span 2;

  display: grid;
  grid-template-rows: 1fr auto 1fr;
  grid-gap: 0.7rem;

  ${global_styles.text};
  background: ${(props) => props.theme.interface[1]};

  &:nth-child(2) {
    box-shadow: 6px 0px 8px rgba(0, 0, 0, 0.14);
  }

  &:last-child {
    box-shadow: -6px 0px 8px rgba(0, 0, 0, 0.14);
  }
`;

export let EllipsisOverflow = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
`;

let SidebarTitle = styled.div`
  margin-top: 10px;
  margin-left: 16px;
  ${global_styles.heading}
`;

let SidebarLine = styled.div`
  // position: relative;
  width: calc(100% - 16px - 16px);
  margin-left: 16px;
  margin-right: 16px;
  border: solid 1px;
  border-color: ${({ theme }) => theme.interface[2]};
`;

export let SidebarButton = styled.div`
  transition: background-color 0.2s;
  cursor: pointer;

  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 8px 16px;

  &:hover {
    background-color: ${({ theme }) => theme.interface.hover};
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
    sheet_view: { selected_id },
    add_file,
    add_item,
    change_item,
    select_item,
    remove_item,
  } = React.useContext(PresentifyContext);

  let theme = useTheme();

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
            display: "flex",
            flexDirection: "row",
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
                select_item(null);
              }

              if (e.key === "Backspace" || e.key === "Delete") {
                if (selected_id != null) {
                  remove_item(selected_id);
                }
              }

              if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
                let item =
                  selected_id && items.find((x) => x.id === selected_id);
                if (item) {
                  // TODO Maybe later, append?
                  set_clipboard([{ ...item, id: null }]);
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

          <Layer>
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
          </Layer>

          <Layer style={{ pointerEvents: "none" }}>
            <InterfaceLayout>
              <Toolbox component_map={component_map} add_item={add_item} />

              {/* Right sidebar */}
              <Sidebar theme={theme}>
                <div
                  style={{
                    minWidth: 0,
                    minHeight: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                  }}
                >
                  <SidebarTitle>Edit layer</SidebarTitle>
                  <Whitespace height={10} />
                  {items
                    .filter((item) => item.id === selected_id)
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
                </div>
                <SidebarLine theme={theme} />

                <div
                  style={{
                    minWidth: 0,
                    minHeight: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <SidebarTitle> Layer list </SidebarTitle>

                  <div style={{ overflowY: "auto", height: "100%" }}>
                    <MemoLayerList />
                  </div>
                </div>
              </Sidebar>
            </InterfaceLayout>
          </Layer>
        </div>
      )}
    </Droptarget>
  );
};

export default Workspace;
