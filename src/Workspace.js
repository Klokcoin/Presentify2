import React, { Component } from 'react';
import { isEqual } from 'lodash';
import JSON6 from 'json-6';
import Measure from 'react-measure';
import styled from 'styled-components';

import { DocumentEvent, Absolute, Whitespace } from './Elements';
import Canvas from './Canvas';
import CanvasItem from './CanvasItem';

import { component_map } from './Components';

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
    return [null, JSON6.parse(json)];
  } catch (err) {
    return [err, null];
  }
};

class Workspace extends Component {
  state = {
    next_id: 1,
    items: [],
    canvas: {
      height: 500,
      width: 500,
    },
    selected_item: null,
    is_pressing_cmd: false,

    // Just keeping in mind that clipboard history is awesome
    clipboard: [],
  };

  add_component = ({ type, ...info }, callback) => {
    let component_info = component_map[type];

    this.setState(({ items, next_id, canvas }) => {
      return {
        next_id: next_id + 1,
        selected_item: next_id,
        items: [
          ...items,
          {
            name: `${component_info.name} #${next_id}`,
            type: type,
            x: 0,
            y: 0,
            rotation: 0,
            height: 100,
            width: 100,
            options: component_info.default_options || {},
            ...info,

            id: next_id,
          },
        ],
      };
    });
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

  select_item = (id) => {
    this.setState({ selected_item: id });
  };

  render() {
    let { selected_item, items, is_pressing_cmd, clipboard } = this.state;
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
      >
        <DocumentEvent
          name="keydown"
          handler={(e) => {
            if (
              e.target.tagName === 'INPUT' ||
              e.target.tagName === 'TEXTAREA'
            ) {
              return;
            }

            if (e.key === 'Control' || e.which === 'Meta') {
              this.setState({
                is_pressing_cmd: true,
              });
            }

            if (e.key === 'Escape') {
              this.setState({
                selected_item: null,
              });
            }

            if (e.key === 'Backspace' || e.key === 'Delete') {
              if (selected_item != null) {
                this.setState({
                  items: items.filter((x) => x.id !== selected_item),
                });
              }
            }

            if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
              let item =
                selected_item && items.find((x) => x.id === selected_item);
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
                })
              }
            }
          }}
          passive
        />
        <DocumentEvent
          name="keyup"
          handler={(e) => {
            // TODO Yeah yeah I hear you thinking
            // .... "but what if I press both of them and then release only one?!"
            // .... Well.. don't do that
            if (e.key === 'Control' || e.which === 'Meta') {
              this.setState({
                is_pressing_cmd: false,
              });
            }
          }}
          passive
        />

        <Measure bounds>
          {({ measureRef, contentRect }) => (
            <div
              style={{ width: '100%', height: '100%', userSelect: 'none' }}
              ref={measureRef}
            >
              {contentRect.bounds.height && (
                <Canvas
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
                        selected={selected_item === item.id}
                        onSelect={() => select_item(item.id)}
                        onChange={(next_item) =>
                          change_item(item.id, next_item)
                        }
                        // inverseScale={inverseScale}
                      >
                        <Absolute
                          top={0}
                          left={0}
                          bottom={0}
                          right={0}
                          style={{
                            pointerEvents: is_pressing_cmd ? 'all' : 'none',
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

        <div
          style={{
            width: 220,
            flexShrink: 0,
            backgroundColor: 'rgb(245, 212, 126)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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

          <div style={{ height: 50 }} />

          {items.filter((x) => x.id === selected_item).map((item) => {
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

          <div style={{ height: 50 }} />

          <div style={{ maxHeight: '30%', overflowY: 'auto' }}>
            {items.map((item) => (
              <div
                onClick={() => select_item(item.id)}
                style={{
                  backgroundColor:
                    item.id === selected_item
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
      </div>
    );
  }
}

export default Workspace;
