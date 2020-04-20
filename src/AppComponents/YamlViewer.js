import React from "react";
import prettier from "prettier/standalone.js";
import json5Parser from "prettier/parser-babel.js";
import JSON5 from "json5";
import styled, { useTheme } from "styled-components";
import { PresentifyContext } from "../PresentifyContext";
import {global_styles} from "../themes/index"

let YamlTextArea = styled.textarea`
  ${global_styles.mono}
`

export let JSON_parse_safe = (json) => {
  try {
    return [null, JSON5.parse(`{${json}}`)];
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

export let YamlViewer = ({ value, id }) => {
  const { change_item } = React.useContext(PresentifyContext);
  let [text, set_text] = React.useState(JSON_stringify(value));
  let [error, set_error] = React.useState(null);
  const theme = useTheme();

  let [parse_error, parsed_value] = React.useMemo(() => {
    return JSON_parse_safe(text);
  }, [text]);

  const onChange = (options) => {
    change_item(id, {
      options: options,
    });
  };

  // Debounce
  React.useEffect(() => {
    if (parsed_value) {
      onChange(parsed_value);
    }
  }, [parsed_value]);

  return (
    <YamlTextArea
      style={{
        width: `100%`,
        boxSizing: "border-box",
        border: "none",
        padding: 16,
        backgroundColor: "transparent",
        height: 400,
      }}
      value={text}
      onChange={(e) => {
        set_text(e.target.value);
      }}
    />
  );
};
