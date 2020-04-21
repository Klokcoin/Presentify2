import React from "react";
import localforage from "localforage";
import uuid from "uuid/v1";
import md5 from "md5";
import immer from "immer";
import { Dataurl, Dimensions, get_image_info } from "./Data/Files.js";
import { component_map } from "./PresentifyComponents";
import { identity_matrix, getScale, inverse } from "./utils/linear_algebra";

export const PresentifyContext = React.createContext();

export const PresentifyConsumer = PresentifyContext.Consumer;

export let remove_from_group = (array, id) => {
  return array
    .filter((item) => item.id !== id)
    .map((item) =>
      item.groupItems
        ? { ...item, groupItems: remove_from_group(item.groupItems, id) }
        : item
    );
};

export let find_in_group = (array, id) => {
  for (let item of array) {
    if (item.id === id) {
      return item;
    } else {
      if (item.groupItems) {
        let sub_item = find_in_group(item.groupItems, id);
        if (sub_item != null) {
          return sub_item;
        }
      }
    }
  }
  return null;
};

export const PresentifyProvider = ({ children }) => {
  const [sheet, set_sheet] = React.useState({ items: [], files: [] });
  const [sheet_view, set_sheet_view] = React.useState({
    selected_ids: [],
    transform: identity_matrix(),
  });
  let loading = React.useRef(true);

  // TODO: we get a nasty flicker when our old sheet & sheet_view load :/ REACT SUSPENSE?!1
  React.useEffect(() => {
    // Load initial data from localstorage
    const fetchData = async () => {
      let stored_sheet_view = await localforage.getItem("sheet_view");
      let stored_sheet = await localforage.getItem("sheet");
      loading.current = false;

      if (stored_sheet_view != null) {
        set_sheet_view(stored_sheet_view);
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
    if (!sheet || loading.current) {
      return;
    }

    localforage.setItem("sheet", sheet);
  }, [sheet]);

  React.useEffect(() => {
    if (!sheet_view || loading.current) {
      return;
    }

    localforage.setItem("sheet_view", sheet_view);
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
    let { default_options } = component_info || {};
    let scale = getScale(inverse(sheet_view.transform));
    let next_id = uuid();

    set_sheet(
      immer((sheet) => {
        sheet.items.push({
          name: `${component_info.name} #${next_id}`,
          type: type,
          x: 0,
          y: 0,
          rotation: 0,
          height: (default_options?.width || viewportHeight) * scale,
          width: (default_options?.height || viewportWidth) * scale,
          options: default_options,
          ...info,

          groupItems: component_info.groupItems || null,
          z: next_id * 10, // * 10 ???
          id: next_id,
        });
      })
    );

    set_sheet_view(
      immer((sheet_view) => {
        sheet_view.selected_ids = [next_id];
      })
    );
  };

  const change_item = (id, change) => {
    set_sheet(
      immer((sheet) => {
        let item = find_in_group(sheet.items, id);
        console.log(`item:`, item);
        Object.assign(item, change);
        // let index = sheet.items.findIndex((x) => x.id === id);
        //
        // if (index !== -1) {
        //   sheet.items[index] = {
        //     ...sheet.items[index],
        //     ...change,
        //   };
        // }
      })
    );
  };

  // Select ONLY THESE ids
  const select_items = (ids = []) => {
    set_sheet_view(
      immer((sheet_view) => {
        sheet_view.selected_ids = ids;
      })
    );
  };

  const remove_item = (id) => {
    set_sheet(
      immer((sheet) => {
        sheet.items = remove_from_group(sheet.items, id);
      })
    );

    if (sheet_view.selected_ids.includes(id)) {
      // Just for concistency, deselect the removed item (probably not necessary tho)
      let index = sheet_view.selected_ids.indexOf(id);

      set_sheet_view(
        immer((sheet_view) => {
          sheet_view.selected_ids = sheet_view.selected_ids.splice(index, 1);
        })
      );
    }
  };

  return (
    <PresentifyContext.Provider
      value={{
        sheet,
        sheet_view,
        set_sheet,
        set_sheet_view,
        add_file,
        add_item,
        change_item,
        select_items,
        remove_item,
      }}
    >
      {children}
    </PresentifyContext.Provider>
  );
};
