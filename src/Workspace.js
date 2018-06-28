import React from 'react';

import { DocumentEvent, Draggable } from './Elements';

let Absolute = ({ left, right, top, bottom, children }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        right,
        top,
        bottom,
      }}
      children={children}
    />
  );
};

let DraggingCircle = () => {
  return (
    <div
      style={{
        border: 'solid 2px black',
        backgroundColor: 'white',
        height: 10,
        width: 10,
        borderRadius: '50%',
      }}
    />
  );
};

class CanvasItem extends React.Component {
  state = {
    movement_state: null,
  };

  render() {
    let { movement_state } = this.state;
    let { item, selected, onSelect, onChange, children } = this.props;

    let act_like_selected = selected || movement_state != null;

    return (
      <Absolute
        top={
          item.y + (movement_state && movement_state.y ? movement_state.y : 0)
        }
        left={
          item.x + (movement_state && movement_state.x ? movement_state.x : 0)
        }
      >
        <div
          onClick={() => {
            onSelect();
          }}
          style={{
            border: act_like_selected ? '1px black dotted' : null,
            position: 'absolute',
            height:
              item.height +
              (movement_state && movement_state.height
                ? movement_state.height
                : 0),
            width:
              item.width +
              (movement_state && movement_state.width
                ? movement_state.width
                : 0),
            position: 'relative',
          }}
        >
          <Draggable
            onMove={(movement_state) => {
              console.log(`${item.id} updated!`);
              this.setState({
                movement_state: {
                  width: movement_state.x,
                  height: movement_state.y,
                },
              });
            }}
            onMoveEnd={(movement_state) => {
              onChange({
                width: item.width + movement_state.x,
                height: item.height + movement_state.y,
              });
              this.setState({
                movement_state: null,
              });
            }}
          >
            <Absolute right={-10} bottom={-10}>
              <DraggingCircle />
            </Absolute>
          </Draggable>

          <Draggable
            onMove={(movement_state) => {
              console.log(`${item.id} updated!`);
              this.setState({
                movement_state: {
                  width: movement_state.x,
                  height: -movement_state.y,
                  y: movement_state.y,
                },
              });
            }}
            onMoveEnd={(movement_state) => {
              onChange({
                width: item.width + movement_state.x,
                height: item.height + -movement_state.y,
                y: item.y + movement_state.y,
              });
              this.setState({
                movement_state: null,
              });
            }}
          >
            <Absolute right={-10} top={-10}>
              <DraggingCircle />
            </Absolute>
          </Draggable>

          <Draggable
            onMove={(movement_state) => {
              console.log(`${item.id} updated!`);
              this.setState({
                movement_state: {
                  width: -movement_state.x,
                  x: movement_state.x,
                  height: -movement_state.y,
                  y: movement_state.y,
                },
              });
            }}
            onMoveEnd={(movement_state) => {
              onChange({
                width: item.width - movement_state.x,
                x: item.x + movement_state.x,
                height: item.height - movement_state.y,
                y: item.y + movement_state.y,
              });
              this.setState({
                movement_state: null,
              });
            }}
          >
            <Absolute left={-10} top={-10}>
              <DraggingCircle />
            </Absolute>
          </Draggable>

          <Draggable
            onMove={(movement_state) => {
              console.log(`${item.id} updated!`);
              this.setState({
                movement_state: {
                  width: -movement_state.x,
                  x: movement_state.x,
                  height: movement_state.y,
                },
              });
            }}
            onMoveEnd={(movement_state) => {
              onChange({
                width: item.width + -movement_state.x,
                x: item.x + movement_state.x,
                height: item.height + movement_state.y,
              });
              this.setState({
                movement_state: null,
              });
            }}
          >
            <Absolute left={-10} bottom={-10}>
              <DraggingCircle />
            </Absolute>
          </Draggable>

          <Draggable
            onMove={(movement_state) => {
              console.log(`${item.id} updated!`);
              this.setState({ movement_state });
            }}
            onMoveEnd={(movement_state) => {
              onChange({
                y: item.y + movement_state.y,
                x: item.x + movement_state.x,
              });
              this.setState({
                movement_state: null,
              });
            }}
          >
            <Absolute right={0} top={0} left={0} bottom={0}>
              {children}
            </Absolute>
          </Draggable>
        </div>
      </Absolute>
    );
  }
}

let component_map = {
  'dralletje/rectangle': {
    name: 'Rectangle',
    Component: ({ size }) => {
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: 'rgb(127, 146, 245)',
          }}
        />
      );
    },
  },
  'dralletje/circle': {
    name: 'Circle',
    Component: ({ size }) => {
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '50%',
            backgroundColor: 'rgb(127, 146, 245)',
          }}
        />
      );
    },
  },
};

export class Workspace extends React.Component {
  state = {
    next_id: 1,
    items: [],
    canvas: {
      height: 500,
      width: 500,
    },
    selected_item: null,
  };

  render() {
    let { selected_item, items, canvas, next_id } = this.state;

    let add_component = ({ type }) => {
      this.setState({
        next_id: next_id + 1,
        items: [
          ...items,
          {
            id: next_id,
            type: type,
            x: canvas.width / 2,
            y: canvas.height / 2,
            height: 100,
            width: 100,
          },
        ],
      });
    };

    return (
      <div
        style={{
          backgroundColor: 'rgb(131, 117, 180)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              boxShadow: '0px 3px 20px black',
              width: canvas.width,
              height: canvas.height,
              position: 'relative',
            }}
          >
            {items.map((item) => {
              let component_info = component_map[item.type];
              return (
                <CanvasItem
                  key={item.id}
                  item={item}
                  selected={selected_item === item.id}
                  onSelect={() => {
                    this.setState({ selected_item: item.id });
                  }}
                  onChange={(next_item) => {
                    this.setState({
                      items: items.map((x) => {
                        if (x.id === item.id) {
                          console.log(`x:`, x);
                          console.log(`item:`, item);
                          let unsanitized = {
                            ...item,
                            ...next_item,
                          };
                          return unsanitized;
                        } else {
                          return x;
                        }
                      }),
                    });
                  }}
                >
                  <component_info.Component size={item} />
                </CanvasItem>
              );
            })}
          </div>
        </div>
        <div
          style={{
            width: 250,
            backgroundColor: 'rgb(245, 212, 126)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {Object.entries(component_map).map(([key, comp]) => (
            <div
              style={{ padding: 50 }}
              onClick={() => {
                add_component({ type: key });
              }}
            >
              {comp.name}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
