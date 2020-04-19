import React from "react";

export let ItemPreviewContext = React.createContext(null);

export let ItemPreviewProvider = ({ children }) => {
  let [preview, set_preview] = React.useState(null);

  return React.useMemo(
    () => (
      <ItemPreviewContext.Provider value={{ preview, set_preview }}>
        {children}
      </ItemPreviewContext.Provider>
    ),
    [children, preview, set_preview]
  );
};
