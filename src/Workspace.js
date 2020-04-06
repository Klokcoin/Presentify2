import React from "react";
import Measure from "react-measure";
import styled from "styled-components/macro";
import uuid from "uuid/v1";
import md5 from "md5";
import ComponentComponent from "@reach/component-component";
import immer from "immer";
import localforage from "localforage";

import { YamlViewer } from "./AppComponents/YamlViewer.js";
import { DocumentEvent, Whitespace, Layer } from "./Elements.js";
import Canvas from "./Components/Canvas.js";
import { Dataurl, Dimensions, get_image_info } from "./Data/Files.js";
import {
  Transformation2DMatrix,
  Transformation2DMatrixFromString,
} from "./Data/TransformationMatrix.js";
import { CanvasItemOverlay } from "./AppComponents/TransformationOverlay.js";
import { Droptarget } from "./Components/Droptarget.js";
import { Dropoverlay } from "./AppComponents/Dropoverlay.js";
import { component_map } from "./PresentifyComponents/";
import { LayerList, LayerListItem } from "./Components/LayerList";

let Sidebar = styled.div`
  width: 232px;
  flex-shrink: 0;
  background-color: rgb(39, 39, 39);
  display: flex;
  flex-direction: column;

  color: white;
  --color: white;
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
  text-transform: capitalize;
  font-family: fantasy;
  font-weight: bold;
`;

let SidebarLine = styled.div`
  width: calc(100% - 16px - 16px);
  margin-left: 16px;
  margin-right: 16px;
  border: solid 1px var(--color, black);
`;

export let SidebarButton = styled.div`
  transition: background-color 0.2s;
  background-color: ${(p) => (p.active ? "#8e8e8e" : "rgba(255, 255, 255, 0)")};
  cursor: pointer;

  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 8px 16px;

  &:hover {
    background-color: #ccc;
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
  let [sheet, set_sheet] = React.useState({
    items: [],
    // Keep these separate from the canvas items, so they can be used multiple times for example
    // TODO We also need ways to check these both ways (canvas item -> files, but also file -> canvas items)
    files: [],
  });

  let [sheet_view, set_sheet_view] = React.useState({
    selected_id: null,
    // TODO Make the transform a simple object so it is serializable into localstorage
    transform: new Transformation2DMatrix(),
  });

  // The order of these matters! If the sheet is retrieved before the transform, items are rendered once with the
  // default transform, before updating to the retrieved transform -> which we don't want
  React.useEffect(() => {
    localforage.getItem("transform").then((transform) => {
      if (transform != null) {
        set_sheet_view({
          transform: Transformation2DMatrixFromString(transform),
        });
      }
    });
  }, []);

  // Load initial sheet from localstorage
  React.useEffect(() => {
    localforage.getItem("sheet").then((stored_sheet) => {
      if (stored_sheet != null) {
        set_sheet(stored_sheet);
      }
    });
  }, []);

  // Store every change to localstorage
  React.useEffect(() => {
    if (sheet != null) {
      localforage.setItem("sheet", sheet);
    }
  }, [sheet]);

  React.useEffect(() => {
    if (sheet_view.transform != null) {
      // Store the TransformationMatrix as a string
      localforage.setItem("transform", sheet_view.transform.toString());
    }
  }, [sheet_view.transform]);

  let add_component = (
    { type, ...info },
    { viewportWidth = 100, viewportHeight = 100 } = {}
  ) => {
    let component_info = component_map[type];

    let result = sheet_view.transform.inverse().applyToCoords({ x: 0, y: 0 });
    let scale = sheet_view.transform.inverse().getScale().x;
    let next_id = uuid();

    set_sheet(
      immer((sheet) => {
        sheet.items.push({
          name: `${component_info.name} #${next_id}`,
          type: type,
          x: result.x,
          y: result.y,
          rotation: 0,
          height: viewportHeight * scale,
          width: viewportWidth * scale,
          options: component_info.default_options || {},
          ...info,

          z: next_id * 10, // * 10 ???
          id: next_id,
        });
      })
    );
    set_sheet_view({
      ...sheet_view,
      selected_id: next_id,
    });
  };

  let add_file = async (file) => {
    let samesize_files = sheet.files.filter((x) => x.size === file.size);
    if (samesize_files.length !== 0) {
      let md5_hash = md5(await Dataurl.from_file(file));
      // Find *possibly* the matching file
      for (let samesize of samesize_files) {
        if (samesize.md5_hash == null) {
          samesize.md5_hash = md5(await Dataurl.from_file(samesize.file));
        }
        if (samesize.md5_hash === md5_hash) {
          return samesize;
        }
      }
    }

    let object_url = URL.createObjectURL(file);
    let image_info = await get_image_info(object_url);
    let { width, height } = Dimensions.contain({
      dimensions: image_info,
      bounds: {
        width: 200,
        height: 200,
      },
    });
    URL.revokeObjectURL(object_url);

    let new_file = {
      id: uuid(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      image: {
        width: width,
        height: height,
      },
    };

    set_sheet(
      immer((sheet) => {
        sheet.files.push(new_file);
      })
    );
    return new_file;
  };

  let change_item = (id, change) => {
    set_sheet(
      immer((sheet) => {
        let index = sheet.items.findIndex((x) => x.id === id);
        if (index !== -1) {
          sheet.items[index] = {
            ...sheet.items[index],
            ...change,
          };
        }
      })
    );
  };

  let select_item = (id) => {
    set_sheet_view({
      ...sheet_view,
      selected_id: id,
    });
  };

  let change_itemOrder = (id, newIndex) => {
    let { items } = sheet;

    console.log("newIndex", newIndex);

    //first remove item, then move it to new position
    let reOrdered_items = items.filter((x) => x.id !== id);

    reOrdered_items.splice(
      newIndex,
      0,
      items.find((x) => x.id === id)
    );

    set_sheet({
      ...sheet,
      items: reOrdered_items,
    });
  };

  return (
    <Droptarget
      onDrop={async (e) => {
        let file = e.dataTransfer.items[0].getAsFile();
        let canvas_file = await add_file(file);
        add_component(
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
          <Dropoverlay is_dragging={is_dragging} />

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
                set_sheet_view({
                  ...sheet_view,
                  selected_id: null,
                });
              }

              if (e.key === "Backspace" || e.key === "Delete") {
                if (sheet_view.selected_id != null) {
                  set_sheet({
                    ...sheet,
                    items: sheet.items.filter(
                      (x) => x.id !== sheet_view.selected_id
                    ),
                  });
                }
              }

              if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
                let item =
                  sheet_view.selected_id &&
                  sheet.items.find((x) => x.id === sheet_view.selected_id);
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
                  add_component(next_element);
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
                <SidebarButton onClick={() => add_component({ type: key })}>
                  <span>{comp.icon}</span>
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
              <LayerList
                items={sheet.items}
                selected_id={sheet_view.selected_id}
                select_item={select_item}
                change_itemOrder={change_itemOrder}
              />
            </div>
          </Sidebar>

          {/* Canvas */}
          <FilesContext.Provider
            value={{
              getFile: (file_id) => {
                // TODO Need way to load in the file into blob when loading
                let file = sheet.files.find((x) => x.id === file_id);
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
                    backgroundColor: "#ccc",
                  }}
                  ref={measureRef}
                >
                  {contentRect.bounds.height && (
                    <Canvas
                      initialTranslation={{
                        x: contentRect.bounds.width / 2,
                        y: contentRect.bounds.height / 2,
                      }}
                      transform={sheet_view.transform}
                      onTransformChange={(change) => {
                        set_sheet_view((state) => {
                          let x = change({ transform: state.transform });
                          if (x != null) {
                            return { ...state, transform: x.transform };
                          }
                        });
                      }}
                      onBackgroundClick={() => {
                        select_item(null);
                      }}
                    >
                      {sheet.items.map((item) => {
                        let component_info = component_map[item.type];
                        return (
                          <CanvasItemOverlay
                            key={item.id}
                            selected={sheet_view.selected_id === item.id}
                            onSelect={() => {
                              select_item(item.id);
                            }}
                            item={item}
                            onChange={(next_item) => {
                              change_item(item.id, next_item);
                            }}
                          >
                            <Layer style={{ pointerEvents: "none" }}>
                              <component_info.Component
                                size={item}
                                options={item.options || {}}
                              />
                            </Layer>
                          </CanvasItemOverlay>
                        );
                      })}
                    </Canvas>
                  )}
                </div>
              )}
            </Measure>
          </FilesContext.Provider>

          {/* Right sidebar */}
          <Sidebar>
            <SidebarTitle>Edit layer</SidebarTitle>
            <Whitespace height={50} />
            {sheet.items
              .filter((x) => x.id === sheet_view.selected_id)
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
                    <YamlViewer
                      value={item.options}
                      onChange={(options) => {
                        change_item(item.id, {
                          options: options,
                        });
                      }}
                    />
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
