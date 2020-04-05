import React from "react";
import prettier from "prettier/standalone.js";
import json5Parser from "prettier/parser-babel.js";
import JSON5 from "json5";

export let JSON_parse_safe = (json) => {
  try {
    return [null, JSON5.parse(json)];
  } catch (err) {
    console.log(`err:`, err);
    return [err, null];
  }
};

let JSON_stringify = (value) => {
  let json = JSON5.stringify(value);
  return prettier
    .format(json, {
      parser: "json5",
      plugins: [json5Parser],
      printWidth: 10,
    })
    .replace(/\n {2}/g, "\n")
    .slice(1, -2)
    .trim();
};

export let YamlViewer = ({ value, onChange }) => {
  let [text, set_text] = React.useState(JSON_stringify(value));
  let [error, set_error] = React.useState(null);

  let [parse_error, parsed_value] = React.useMemo(() => {
    return JSON_parse_safe(text);
  }, [text]);

  // Debounce
  React.useEffect(() => {
    if (parsed_value) {
      onChange(parsed_value);
    }
  }, [parsed_value]);

  return (
    <textarea
      style={{
        width: `100%`,
        boxSizing: "border-box",
        border: "none",
        padding: 16,
        backgroundColor: "transparent",
        color: "white",
        fontSize: 14,
        height: 400,
        fontFamily: `"Menlo", "monospace"`,
      }}
      value={text}
      onChange={(e) => {
        set_text(e.target.value);
      }}
    />
  );
};
