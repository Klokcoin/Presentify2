import React, { Component } from 'react';
import { isEqual, debounce } from 'lodash';
import yaml from 'js-yaml';
import Measure from 'react-measure';
import styled from 'styled-components';
import uuid from 'uuid/v1';
import md5 from 'md5';

import { Transformation2DMatrix } from './TransformationMatrix.js';
import { DocumentEvent, Absolute, Whitespace } from './Elements.js';
import Canvas from './Canvas.js';
import CanvasItem from './CanvasItem.js';
import { Dataurl, Dimensions, Bloburl, get_image_info } from './GetFile.js';

import { component_map } from './Components';

let SidebarTitle = styled.div`
  margin-top: 16px;
  margin-left: 16px;
  text-transform: capitalize;
  font-family: fantasy;
  font-weight: bold;
`;

let ComponentButton = styled.div`
  transition: background-color 0.2s;
  background-color: rgba(255, 255, 255, 0);
  cursor: pointer;

  display: flex;
  flex-direction: row;
  align-items: center;

  &:hover {
    background-color: rgb(255, 108, 240);
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
export let LoadFile = ({ url, children }) => {
  let local_match = url.match(/canvas-local:\/\/(.*)/);
  if (local_match) {
    return (
      <FilesContext.Consumer>{({ getFile }) =>{
        let file = getFile(local_match[1]);
        return children({ url: file.blobUrl })
      }}</FilesContext.Consumer>
    )
  } else {
    return children({ url });
  }
}

class Workspace extends Component {
  state = {
    transform: new Transformation2DMatrix(),
    next_id: 1,
    items: [],
    canvas: {
      height: 500,
      width: 500,
    },
    selected_id: null,
    is_dragging: false,

    // Just keeping in mind that clipboard history is awesome
    clipboard: [],

    // Keep these separate from the canvas, so they can be used multiple times for example
    // TODO We also need ways to check these both ways (canvas item -> files, but also file -> canvas items)
    files: [],
  };

  add_component = (
    { type, viewportWidth = 100, viewportHeight = 100, ...info },
  ) => {
    let component_info = component_map[type];

    this.setState(({ items, next_id, canvas, transform }) => {
      // let result = transform.inverse().applyToCoords({ x: 0, y: 0 });
      // let scale = transform.inverse().getScale().x;
      return {
        next_id: next_id + 1,
        selected_id: next_id,
        items: [
          ...items,
          {
            name: `${component_info.name} #${next_id}`,
            type: type,
            // x: result.x,
            // y: result.y,
            // rotation: 0,
            // height: viewportHeight * scale,
            // width: viewportWidth * scale,
            viewportHeight,
            viewportWidth,
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

    let dataurl = await Dataurl.from_file(file);
    let bloburl = await URL.createObjectURL(file);

    let samesize_files = files.filter(x => x.size === file.size);
    if (samesize_files.length !== 0) {
      let md5_hash = md5(dataurl);
      // Find *possibly* the matching file
      let matching_md5 = samesize_files.find(x => {
        if (x.md5_hash == null) {
          x.md5_hash = md5(x.dataurl);
        }
        return x.md5_hash === md5_hash
      });
      if (matching_md5 != null) {
        return matching_md5;
      }
    }

    let image_info = await get_image_info(dataurl);
    let { width, height } = Dimensions.contain({
      dimensions: image_info,
      bounds: {
        width: 200,
        height: 200,
      },
    });

    let new_file = {
      id: uuid(),
      name: file.name,
      type: file.type,
      size: file.size,
      blobUrl: bloburl,
      dataurl: dataurl,
      image: {
        width: width,
        height: height,
      },
    }
    this.setState({
      files: [
        ...this.state.files,
        new_file,
      ],
    });
    return new_file;
  }

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

  select_item = (id) => {
    this.setState({ selected_id: id });
  };

  dragleave_debounce = debounce((fn) => {
    return fn();
  }, 100);

  render() {
    let {
      selected_id,
      items,
      clipboard,
      transform,
      is_dragging,
    } = this.state;
    let { add_component, change_item, select_item } = this;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (this.state.is_dragging === false) {
            this.setState({ is_dragging: true });
          } else {
            this.dragleave_debounce(() => {
              this.setState({ is_dragging: false });
            });
          }
        }}
        onDrop={async (e) => {
          e.preventDefault();
          let file = e.dataTransfer.items[0].getAsFile();
          let canvas_file = await this.add_file(file);

          add_component(
            {
              type: 'dralletje/image',
              options: {
                url: `canvas-local://${canvas_file.id}`,
              },
              viewportWidth: canvas_file.image.width,
              viewportHeight: canvas_file.image.height,
            }
          );
        }}
      >
        <Absolute
          top={0}
          bottom={0}
          right={0}
          left={0}
          style={{
            zIndex: 10,
            backgroundColor: 'rgba(138, 245, 129, 0.8)',
            color: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity .2s',
            opacity: is_dragging ? 1 : 0,
            pointerEvents: is_dragging ? 'all' : 'none',
          }}
        >
          <div
            style={{
              padding: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 5,
            }}
          >
            Add image to your canvas
          </div>
        </Absolute>

        <DocumentEvent
          name="keydown"
          handler={(e) => {
            if (
              e.target.tagName === 'INPUT' ||
              e.target.tagName === 'TEXTAREA'
            ) {
              return;
            }

            if (e.key === 'Escape') {
              this.setState({
                selected_id: null,
              });
            }

            if (e.key === 'Backspace' || e.key === 'Delete') {
              if (selected_id != null) {
                this.setState({
                  items: items.filter((x) => x.id !== selected_id),
                });
              }
            }

            if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
              let item =
                selected_id && items.find((x) => x.id === selected_id);
              if (item) {
                this.setState({
                  // TODO Maybe later, append?
                  clipboard: [{ ...item, id: null }],
                });
              }
            }

            if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
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
        <div
          style={{
            width: 250,
            backgroundColor: 'rgb(245, 212, 126)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Adding layers */}
          <SidebarTitle> Add layer </SidebarTitle>
          <Whitespace height={16} />
          <div style={{ flexShrink: 0 }}>
            {Object.entries(component_map).map(([key, comp]) => (
              <ComponentButton
                style={{
                  paddingLeft: 50,
                  paddingRight: 50,
                  paddingTop: 16,
                  paddingBottom: 16,
                }}
                onClick={() => add_component({ type: key })}
              >
                <span>{comp.icon}</span>
                <div style={{ width: 16 }} />
                <span>{comp.name}</span>
              </ComponentButton>
            ))}
          </div>
          <Whitespace height={16}/>

          {/* Layer list */}
          <div
            style={{
              width: 'calc(100% - 16px - 16px)',
              marginLeft: '16px',
              marginRight: '16px',
              border: 'solid 1px black',
            }}
          />
          <SidebarTitle> Layer list </SidebarTitle>
          <div style={{ maxHeight: '30%', overflowY: 'auto' }}>
            {items.map((item) => (
              <div
                onClick={() => select_item(item.id)}
                style={{
                  backgroundColor:
                    item.id === selected_id
                      ? 'rgba(255,255,255,.8)'
                      : 'transparent',
                  padding: 16,
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>

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
                style={{ width: '100%', height: '100%', userSelect: 'none' }}
                ref={measureRef}
              >
                {contentRect.bounds.height && (
                  <Canvas
                    transform={transform}
                    onTransformChange={(change) => {
                      this.setState((state) => {
                        let x = change({ transform: state.transform });
                        if (x != null) {
                          return {
                            transform: x.transform,
                          };
                        }
                      });
                    }}
                    select_item={select_item}
                    initialTranslation={{
                      x: contentRect.bounds.width / 2,
                      y: contentRect.bounds.height / 2,
                    }}
                  >
                    {items.map((item) => {
                      let component_info = component_map[item.type];
                      return (
                        <CanvasItem
                          key={item.id}
                          item={item}
                          selected={selected_id === item.id}
                          onSelect={() => select_item(item.id)}
                          getInitialState={() => {
                            let { x, y } = transform.inverse().applyToCoords({ x: 0, y: 0 })
                            let scale = transform.inverse().getScale().x

                            return {
                              x,
                              y,
                              rotation: 0,
                              height: item.viewportHeight * scale,
                              width: item.viewportWidth * scale,
                            }
                          }}
                        >
                          <Absolute
                            top={0}
                            left={0}
                            bottom={0}
                            right={0}
                            style={{
                              pointerEvents: 'none',
                            }}
                          >
                            <component_info.Component
                              size={item}
                              options={item.options || {}}
                            />
                          </Absolute>
                        </CanvasItem>
                      );
                    })}
                  </Canvas>
                )}
              </div>
            )}
          </Measure>
        </FilesContext.Provider>

        {/* Right sidebar */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            backgroundColor: 'rgb(245, 212, 126)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Edit layer */}
          <SidebarTitle> Edit layer </SidebarTitle>
          <Whitespace height={50} />
          {items.filter((x) => x.id === selected_id).map((item) => {
            let component_info = component_map[item.type];

            let unsaved =
              item.options_unsaved || JSON.stringify(item.options, null, 2);
            let is_the_same = isEqual(
              JSON_parse_safe(unsaved)[1],
              item.options
            );

            return (
              <div style={{ overflowY: 'auto' }}>
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
                    boxSizing: 'border-box',
                    border: 'none',
                    padding: 16,
                    backgroundColor: 'crimson',
                    color: 'white',
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
        </div>
      </div>
    );
  }
}

export default Workspace;
