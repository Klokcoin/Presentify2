import React from "react";
import localforage from "localforage";
import uuid from "uuid/v1";
import md5 from "md5";
import immer from "immer";
import { Dataurl, Dimensions, get_image_info } from "./Data/Files.js";
import { component_map } from "./PresentifyComponents";
import { Transformation2DMatrix } from "./Data/TransformationMatrix";

export const PresentifyContext = React.createContext();

export const PresentifyConsumer = PresentifyContext.Consumer;

let initial_sheet = { items: [], files: [] };

let initial_sheet_view = {
  selected_id: null,
  transform: new Transformation2DMatrix(),
};

export const PresentifyProvider = ({ children }) => {
  const [sheet, set_sheet] = React.useState(initial_sheet);
  const [sheet_view, set_sheet_view] = React.useState(initial_sheet_view);

  React.useEffect(() => {
    // Load initial data from localstorage
    const fetchData = async () => {
      let stored_sheet_view = await localforage.getItem("sheet_view");
      let stored_sheet = await localforage.getItem("sheet");

      if (stored_sheet_view != null) {
        set_sheet_view({
          ...stored_sheet_view,
          transform: new Transformation2DMatrix(stored_sheet_view.transform),
        });
      }

      if (stored_sheet != null) {
        set_sheet(stored_sheet);
      }
    };

    try {
      fetchData();
    } catch (error) {
      console.error("Could not fetch stored data", error);
    }
  }, []);

  // Store every change to localstorage
  React.useEffect(() => {
    // NOTE: if we don't check for this here, we will store the default sheet before we can load our stored one, overwriting it...;
    if (JSON.stringify(sheet) !== JSON.stringify(initial_sheet)) {
      localforage.setItem("sheet", sheet);
    }
  }, [sheet]);

  React.useEffect(() => {
    // NOTE: if we don't check for this here, we will store the default sheet before we can load our stored one, overwriting it...
    if (JSON.stringify(sheet_view) !== JSON.stringify(initial_sheet_view)) {
      localforage.setItem("sheet_view", sheet_view);
    }
  }, [sheet_view]);

  const add_file = async (file) => {
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

  const add_item = (
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

  const change_item = (id, change) => {
    console.log("change", id, change);
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

  const select_item = (id) => {
    set_sheet_view({
      ...sheet_view,
      selected_id: id,
    });
  };

  const remove_item = (id) => {
    set_sheet({
      ...sheet,
      items: sheet.items.filter((x) => x.id !== id),
    });

    if (sheet_view.selected_id === id) {
      // Just for concistency, deselect the removed item (probably not necessary tho)
      set_sheet_view({
        ...sheet_view,
        selected_id: null,
      });
    }
  };

  const reorder_item = (oldIndex, newIndex) => {
    set_sheet(
      immer((sheet) => {
        let [removed] = sheet.items.splice(oldIndex, 1);
        sheet.items.splice(newIndex, 0, removed);
      })
    );
  };

  const change_transform = (arg) => {
    let new_transform =
      typeof arg === "function" ? arg(sheet_view.transform) : arg;

    if (new_transform) {
      set_sheet_view({
        ...sheet_view,
        transform: new_transform,
      });
    }
  };

  return (
    <PresentifyContext.Provider
      value={{
        sheet,
        sheet_view,
        add_file,
        add_item,
        change_item,
        select_item,
        remove_item,
        reorder_item,
        change_transform,
      }}
    >
      {children}
    </PresentifyContext.Provider>
  );
};
