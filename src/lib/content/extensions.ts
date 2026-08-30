import { mergeAttributes,Node } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TaskItem,TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";
export const Callout=Node.create({name:"callout",group:"block",content:"block+",defining:true,addAttributes(){return{kind:{default:"info",parseHTML:(element)=>element.getAttribute("data-callout")||"info"}};},parseHTML(){return[{tag:"div[data-callout]"}];},renderHTML({HTMLAttributes}){const kind=["callout","info","warning","medical","reference"].includes(String(HTMLAttributes.kind))?String(HTMLAttributes.kind):"info";return["div",mergeAttributes(HTMLAttributes,{"data-callout":kind}),0];}});
export const contentExtensions=[StarterKit.configure({heading:{levels:[2,3,4]},link:{openOnClick:false,autolink:true,defaultProtocol:"https",protocols:["http","https","mailto"],HTMLAttributes:{rel:"noopener noreferrer"}}}),TaskList,TaskItem.configure({nested:true}),Highlight.configure({multicolor:false}),Image.configure({inline:false,allowBase64:false,HTMLAttributes:{loading:"lazy"}}),TableKit.configure({table:{resizable:true}}),Callout];
