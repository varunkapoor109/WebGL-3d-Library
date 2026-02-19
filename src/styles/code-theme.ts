import type { PrismTheme } from "prism-react-renderer";

export const codeTheme: PrismTheme = {
  plain: {
    color: "#e1e4e8",
    backgroundColor: "#0d1117",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#8b949e" },
    },
    {
      types: ["punctuation"],
      style: { color: "#c9d1d9" },
    },
    {
      types: ["property", "tag", "boolean", "number", "constant", "symbol", "deleted"],
      style: { color: "#79c0ff" },
    },
    {
      types: ["selector", "attr-name", "string", "char", "builtin", "inserted"],
      style: { color: "#a5d6ff" },
    },
    {
      types: ["operator", "entity", "url"],
      style: { color: "#d2a8ff" },
    },
    {
      types: ["atrule", "attr-value", "keyword"],
      style: { color: "#ff7b72" },
    },
    {
      types: ["function", "class-name"],
      style: { color: "#d2a8ff" },
    },
    {
      types: ["regex", "important", "variable"],
      style: { color: "#ffa657" },
    },
  ],
};
