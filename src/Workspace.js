import React from "react";
import { isEqual } from "lodash";
import yaml from "js-yaml";
import Measure from "react-measure";
import styled from "styled-components/macro";
import uuid from "uuid/v1";
import md5 from "md5";
import ComponentComponent from "@reach/component-component";

import localforage from "localforage";

import { DocumentEvent, Absolute, Whitespace, Layer } from "./Elements.js";
import Canvas from "./Components/Canvas.js";
import { Dataurl, Dimensions, get_image_info } from "./Data/Files.js";
import { Transformation2DMatrix } from "./Data/TransformationMatrix.js";
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

let JSON_parse_safe = (json) => {
  try {
    return [null, yaml.safeLoad(json)];
  } catch (err) {
    console.log(`err:`, err);
    return [err, null];
  }
};

export let FilesContext = React.createContext({
  getFile: () => {
    throw new Error(`Need a provider for FilesContext.Consumer`);
  },
});
let BLOBURL = Symbol(
  "The blob url, but only valid in the document it was created in"
);
export let LoadFile = ({ url, children }) => {
  let local_match = url.match(/canvas-local:\/\/(.*)/);
  if (local_match) {
    return (
      <FilesContext.Consumer>
        {({ getFile }) => (
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
        )}
      </FilesContext.Consumer>
    );
  } else {
    return children({ url });
  }
};

class Workspace extends React.Component {
  state = {
    transform: new Transformation2DMatrix(),
    items: [],
    canvas: {
      height: 500,
      width: 500,
    },
    selected_id: null,

    // Just keeping in mind that clipboard history is awesome
    clipboard: [],

    // Keep these separate from the canvas, so they can be used multiple times for example
    // TODO We also need ways to check these both ways (canvas item -> files, but also file -> canvas items)
    files: [],
  };

  async componentDidMount() {
    let workspace = await localforage.getItem("workspace");
    if (workspace != null) {
      this.setState({
        files: workspace.files,
        canvas: workspace.canvas,
        items: workspace.items,
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.files !== prevState.files ||
      this.state.canvas !== prevState.canvas ||
      this.state.items !== prevState.items
    ) {
      // NOTE Workspace: Includes files, a document, maybe multiple documents?
      localforage.setItem("workspace", {
        files: this.state.files,
        canvas: this.state.canvas,
        items: this.state.items,
      });
    }
  }

  add_component = (
    { type, ...info },
    { viewportWidth = 100, viewportHeight = 100 } = {}
  ) => {
    let component_info = component_map[type];

    this.setState(({ items, canvas, transform }) => {
      let result = transform.inverse().applyToCoords({ x: 0, y: 0 });
      let scale = transform.inverse().getScale().x;
      let next_id = uuid();
      return {
        selected_id: next_id,
        items: [
          ...items,
          {
            name: `${component_info.name} #${next_id}`,
            type: type,
            x: result.x,
            y: result.y,
            rotation: 0,
            height: viewportHeight * scale,
            width: viewportWidth * scale,
            options: component_info.default_options || {},
            ...info,

            z: next_id * 10,
            id: next_id,
          },
        ],
      };
    });
  };

  add_file = async (file) => {
    let { files } = this.state;

    let samesize_files = files.filter((x) => x.size === file.size);
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
    this.setState({
      files: [...this.state.files, new_file],
    });
    return new_file;
  };

  change_item = (id, change) => {
    this.setState(({ items }) => {
      return {
        items: items.map((x) => {
          if (x.id === id) {
            let unsanitized = {
              ...x,
              ...change,
            };
            return unsanitized;
          } else {
            return x;
          }
        }),
      };
    });
  };

  change_itemOrder(id, newPosition) {
    let { selected_id, items } = this.state;
    //first remove item, then move it to new position

    let reOrdered_items = items.filter((x) => x.id !== selected_id);

    reOrdered_items.splice(
      newPosition,
      0,
      items.find((x) => x.id === selected_id)
    );
    console.log("new:", reOrdered_items);

    this.setState({
      items: reOrdered_items,
    });
  }

  select_item = (id) => {
    this.setState({ selected_id: id });
  };

  handle_removeItem = () => {
    let { selected_id, items } = this.state;

    if (selected_id) {
      console.log("going to remove:", selected_id);

      this.setState({
        items: items.filter((x) => x.id !== selected_id),
      });
    }
  };

  render() {
    let { selected_id, items, clipboard, transform } = this.state;
    let { add_component, change_item, select_item } = this;

    return (
      <Droptarget
        onDrop={async (e) => {
          let file = e.dataTransfer.items[0].getAsFile();
          let canvas_file = await this.add_file(file);
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
                  this.setState({
                    selected_id: null,
                  });
                }

                if (e.key === "Backspace" || e.key === "Delete") {
                  if (selected_id != null) {
                    this.setState({
                      items: items.filter((x) => x.id !== selected_id),
                    });
                  }
                }

                if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
                  let item =
                    selected_id && items.find((x) => x.id === selected_id);
                  if (item) {
                    this.setState({
                      // TODO Maybe later, append?
                      clipboard: [{ ...item, id: null }],
                    });
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
                    this.setState({
                      // NOTE This should never attempt, but always overwrite
                      clipboard: [next_element],
                    });
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

              <div>
                <button onClick={() => this.change_itemOrder(0, 0)}>/\</button>
                <button onClick={this.handle_removeItem}>remove item</button>
              </div>

              <SidebarTitle> Layer list </SidebarTitle>
              <LayerList
                items={items}
                selected_id={selected_id}
                select_item={select_item}
              >
                {/* {items.map((item) => (
                  <SidebarButton
                    active={item.id === selected_id}
                    onClick={() => select_item(item.id)}
                  >
                    <LayerListItem>
                      <EllipsisOverflow>{item.name}</EllipsisOverflow>
                    </LayerListItem>
                  </SidebarButton>
                ))} */}
              </LayerList>
            </Sidebar>

            {/* Canvas */}
            <FilesContext.Provider
              value={{
                getFile: (file_id) => {
                  // TODO Need way to load in the file into blob when loading
                  let file = this.state.files.find((x) => x.id === file_id);
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
                        transform={transform}
                        onTransformChange={(change) => {
                          this.setState((state) => {
                            let x = change({ transform: state.transform });
                            if (x != null) {
                              return { transform: x.transform };
                            }
                          });
                        }}
                        onBackgroundClick={() => {
                          select_item(null);
                        }}
                      >
                        {items.map((item) => {
                          let component_info = component_map[item.type];
                          return (
                            <CanvasItemOverlay
                              key={item.id}
                              selected={selected_id === item.id}
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
              {items
                .filter((x) => x.id === selected_id)
                .map((item) => {
                  let component_info = component_map[item.type];

                  let unsaved =
                    item.options_unsaved ||
                    JSON.stringify(item.options, null, 2);
                  let is_the_same = isEqual(
                    JSON_parse_safe(unsaved)[1],
                    item.options
                  );

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
                      <textarea
                        style={{
                          width: `100%`,
                          boxSizing: "border-box",
                          border: "none",
                          padding: 16,
                          backgroundColor: "transparent",
                          color: "white",
                          fontSize: 12,
                          height: 400,
                        }}
                        value={unsaved}
                        onChange={(e) => {
                          let [err, obj] = JSON_parse_safe(e.target.value);
                          change_item(item.id, {
                            options: err || !obj ? item.options : obj,
                            options_unsaved: e.target.value,
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
  }
}

export default Workspace;
