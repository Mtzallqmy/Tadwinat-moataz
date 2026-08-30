import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import sanitizeHtml from "sanitize-html";
import { contentExtensions } from "@/lib/content/extensions";

const allowedTags = [
  "p", "br", "strong", "em", "u", "s", "a", "mark", "code", "pre",
  "h1", "h2", "h3", "blockquote", "hr", "ul", "ol", "li", "div", "span",
  "label", "input", "img", "table", "thead", "tbody", "tr", "th", "td",
];

export function renderContentJson(content: JSONContent) {
  const rawHtml = generateHTML(content, contentExtensions);
  return sanitizeHtml(rawHtml, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      div: ["data-callout", "data-type"],
      ul: ["data-type"],
      li: ["data-type", "data-checked"],
      input: ["type", "checked", "disabled"],
      table: ["data-type"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      a: ["http", "https", "mailto"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    parser: { lowerCaseAttributeNames: true },
  });
}

export function contentJsonToText(content: JSONContent) {
  const chunks: string[] = [];

  function walk(node: JSONContent) {
    if (typeof node.text === "string") chunks.push(node.text);
    if (["paragraph", "heading", "blockquote", "listItem", "taskItem", "callout"].includes(node.type ?? "")) {
      chunks.push("\n");
    }
    node.content?.forEach(walk);
  }

  walk(content);
  return chunks.join(" ").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}
