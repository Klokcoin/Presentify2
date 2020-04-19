import React from "react";

import { Layer } from "../Elements.js";
import { MemoItemOverlay } from "../AppComponents/ItemOverlay.js";
import { PresentifyContext, find_in_group } from "../PresentifyContext.js";

export let BasictransformationLayer = () => {
  const { sheet_view, sheet, change_item } = React.useContext(
    PresentifyContext
  );

  let item = find_in_group(sheet.items, sheet_view.selected_id);

  console.log(`item:`, item);

  return (
    <Layer style={{ pointerEvents: "none" }}>
      {false && item && (
        <div style={{ pointerEvents: "all" }}>
          <MemoItemOverlay item={item} />
        </div>
      )}
    </Layer>
  );
};
