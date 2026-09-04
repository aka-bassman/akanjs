"use client";
import { cn, usePage } from "akanjs/client";
import { useFieldTool } from "akanjs/store";
import { Fragment, type ReactNode, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BiTrash, BiX } from "react-icons/bi";
import { MdDragIndicator } from "react-icons/md";
import { agentAttrs } from "../agentAttrs";
import { badgeRecipe } from "../Badge";
import { buttonRecipe } from "../Button";
import { DraggableList } from "../DraggableList";
import { Input } from "../Input";
import { useUiRecipe } from "../UiOverride";
import { Label } from "./Label";

export interface ListProps<Item> {
  className?: string;
  labelClassName?: string;
  label?: string;
  desc?: string;
  nullable?: boolean;
  value: Item[] | null;
  onChange: (value: Item[]) => void;
  onAdd: () => void;
  renderItem: (item: Item, idx: number) => ReactNode;
}
export const List = <Item,>({
  className,
  labelClassName,
  label,
  desc,
  value,
  onChange,
  onAdd,
  nullable,
  renderItem,
}: ListProps<Item>) => {
  const recipe = useUiRecipe("button") ?? buttonRecipe;
  useFieldTool(onChange);
  const items = value ?? [];
  return (
    <div {...agentAttrs(onChange)} className={cn("flex w-full flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <div className="mb-2 flex w-full flex-col gap-2 rounded-box border border-border p-2">
        {items.map((item, idx) => (
          // `Fragment` rather than `<>`: the mapped element is the list child, so a key on its first child is a
          // key on nothing. Index-keyed on purpose — these rows are embedded scalars with no id of their own.
          <Fragment key={idx}>
            <div className="flex h-full w-full items-center justify-between gap-2">
              {renderItem(item, idx)}
              <div className="flex gap-2 border-border border-l pl-2">
                <button
                  className={recipe(
                    { variant: "outline", size: "icon" },
                    "size-6 border-destructive p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground",
                  )}
                  onClick={() => {
                    onChange(items.filter((_, i) => i !== idx));
                  }}
                >
                  <BiTrash />
                </button>
              </div>
            </div>
            {idx < items.length - 1 ? <div className="h-[0.5px] w-full bg-muted px-2" /> : null}
          </Fragment>
        ))}
        <button
          className={recipe({ variant: "outline" })}
          onClick={() => {
            onAdd();
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export interface TextListProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string[] | null;
  onChange: (value: string[]) => void;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  cache?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  minlength?: number;
  maxlength?: number;
  minTextlength?: number;
  maxTextlength?: number;
}
export const TextList = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  placeholder,
  disabled,
  transform = (v) => v,
  minlength = 0,
  maxlength = 50,
  minTextlength = 2,
  maxTextlength = 200,
  cache,
  validate,
  inputClassName,
}: TextListProps) => {
  useFieldTool(onChange, { transform, disabled, sortable: true });
  const { l } = usePage();
  const recipe = useUiRecipe("button") ?? buttonRecipe;
  const texts = value ?? [];
  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={!minlength} label={label} desc={desc} /> : null}
      <div className="mb-5 h-full gap-2 rounded-box border border-border p-2">
        <DraggableList
          className="h-full gap-2"
          // Wrapped on purpose: this component already published the field with its own `transform`, and handing
          // the reference down would register the same names a second time from the list inside it.
          onChange={(sorted: string[]) => {
            onChange(sorted);
          }}
          onRemove={(_, idx) => {
            onChange(texts.filter((_, i) => i !== idx));
          }}
        >
          {texts.map((text, idx) => (
            <DraggableList.Item key={idx} value={text}>
              <div className="flex w-full items-center">
                <DraggableList.Cursor>
                  <MdDragIndicator className="text-xl" />
                </DraggableList.Cursor>
                <div className="flex w-full items-center justify-center gap-5">
                  <Input
                    value={text}
                    cacheKey={cache ? `${label}-${desc}-textList-[${idx}]` : undefined}
                    onChange={(text) => {
                      const newValue = [...texts];
                      newValue[idx] = transform(text);
                      onChange(newValue);
                    }}
                    validate={(text: string) => {
                      if (text.length < minlength) return l("base.textTooShortError", { minlength: minTextlength });
                      else if (text.length > maxlength) return l("base.textTooLongError", { maxlength: maxTextlength });
                      else return validate?.(text) ?? true;
                    }}
                    className={cn("w-full", inputClassName)}
                    inputClassName="h-8 w-full"
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                  <button
                    className={recipe(
                      { variant: "outline", size: "icon" },
                      "size-6 border-destructive p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground",
                    )}
                    onClick={() => {
                      onChange(texts.filter((_, i) => i !== idx));
                    }}
                  >
                    <BiTrash />
                  </button>
                </div>
              </div>
            </DraggableList.Item>
          ))}
        </DraggableList>
        <div className="my-5 h-[0.5px] bg-foreground/20" />
        {texts.length <= maxTextlength ? (
          <button
            className={recipe({ variant: "outline" }, "w-full")}
            onClick={() => {
              onChange([...texts, ""]);
            }}
          >
            + New
          </button>
        ) : null}
      </div>
    </div>
  );
};

export interface TagsProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string[] | null;
  onChange: (value: string[]) => void;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  minlength?: number;
  maxlength?: number;
  minTextlength?: number;
  maxTextlength?: number;
  secret?: boolean;
}
export const Tags = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  placeholder,
  disabled,
  transform = (v) => v,
  minlength = 0,
  maxlength = 50,
  minTextlength = 2,
  maxTextlength = 10,
  validate,
  inputClassName,
}: TagsProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  const badge = useUiRecipe("badge") ?? badgeRecipe;
  const tagList = value ?? [];
  const [inputVisible, setInputVisible] = useState(false);
  const [tag, setTag] = useState("");
  const addTag = () => {
    if (!tag.length) return;
    onChange([...tagList, tag]);
    setInputVisible(false);
    setTag("");
  };

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={!minlength} label={label} desc={desc} /> : null}
      <div className="flex w-full flex-wrap items-center gap-1 rounded-box border border-border p-2">
        {tagList.map((val, idx) => (
          <span className={badge({ variant: "outline" }, "items-center")} key={idx}>
            <div className="text-xs italic">#</div>
            {val}
            <BiX
              className="ml-1 cursor-pointer opacity-50 duration-200 hover:opacity-100"
              onClick={() => {
                if (!disabled) onChange(tagList.filter((v, i) => i !== idx));
              }}
            />
          </span>
        ))}
        {inputVisible ? (
          <Input
            autoFocus
            icon={<div className="text-xs italic">#</div>}
            className="h-6 w-24 items-center justify-start rounded-full border px-4"
            inputClassName="focus:border-0 border-0 bg-transparent text-xs h-full w-full"
            placeholder={placeholder}
            value={tag}
            onChange={(value) => {
              if (value.length > maxTextlength) return;
              setTag(transform(value));
            }}
            onBlur={addTag}
            onPressEnter={addTag}
            onPressEscape={() => {
              setInputVisible(false);
              setTag("");
            }}
            validate={(text: string) => {
              if (text.length < minTextlength) return l("base.textTooShortError", { minlength: minTextlength });
              else if (text.length > maxTextlength) return l("base.textTooLongError", { maxlength: maxTextlength });
              else return validate?.(text) ?? true;
            }}
          />
        ) : !disabled ? (
          <div
            className="flex items-center gap-2 rounded-full bg-success px-2 py-1 text-success-foreground text-xs duration-200 hover:cursor-pointer hover:opacity-80"
            onClick={() => {
              setInputVisible(true);
            }}
          >
            <AiOutlinePlus />
            New Tag
          </div>
        ) : null}
      </div>
    </div>
  );
};
