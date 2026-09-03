"use client";
import { cn, usePage } from "akanjs/client";
import { formatPhone, isPhoneNumber } from "akanjs/common";
import { useFieldTool } from "akanjs/store";
import { agentAttrs } from "../agentAttrs";
import { Input } from "../Input";
import { Label } from "./Label";

interface TextProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string | null;
  onChange: (value: string) => void;
  inputClassName?: string;
  placeholder?: string;
  nullable?: boolean;
  cache?: boolean;
  disabled?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  minlength?: number;
  maxlength?: number;
  onPressEnter?: () => void;
  inputStyleType?: "bordered" | "borderless" | "underline";
}
export const Text = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  placeholder,
  nullable,
  disabled,
  minlength = nullable ? 0 : 2,
  maxlength = 200,
  transform = (v) => v,
  validate,
  onPressEnter,
  cache,
  inputClassName,
  inputStyleType = "bordered",
}: TextProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Input
        {...agentAttrs(onChange)}
        cacheKey={cache ? `${label}-${desc}-text` : undefined}
        inputStyleType={inputStyleType}
        value={value ?? ""}
        nullable={nullable}
        placeholder={placeholder}
        onChange={(value) => {
          onChange(transform(value));
        }}
        disabled={disabled}
        className={cn("w-full", "")}
        inputClassName={cn("w-full focus:border-primary", inputClassName)}
        validate={(text: string) => {
          if (text.length < minlength) return l("base.textTooShortError", { minlength });
          else if (text.length > maxlength) return l("base.textTooLongError", { maxlength });
          else return validate?.(text) ?? true;
        }}
        onPressEnter={onPressEnter}
      />
    </div>
  );
};

interface TextAreaProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string | null;
  onChange: (value: string) => void;
  inputClassName?: string;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  rows?: number;
  minlength?: number;
  maxlength?: number;
  cache?: boolean;
  onPressEnter?: () => void;
}
export const TextArea = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  placeholder,
  nullable,
  disabled,
  rows = 3,
  minlength = nullable ? 0 : 2,
  maxlength = 1000,
  transform = (v) => v,
  validate,
  onPressEnter,
  cache,
  inputClassName,
}: TextAreaProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Input.TextArea
        {...agentAttrs(onChange)}
        value={value ?? ""}
        cacheKey={cache ? `${label}-${desc}-textArea` : undefined}
        nullable={nullable}
        placeholder={placeholder}
        onChange={(value) => {
          onChange(transform(value));
        }}
        disabled={disabled}
        rows={rows}
        className={cn("h-full w-full")}
        inputClassName={cn("w-full focus:border-primary", inputClassName)}
        validate={(text: string) => {
          if (text.length < minlength) return l("base.textTooShortError", { minlength });
          else if (text.length > maxlength) return l("base.textTooLongError", { maxlength });
          else return validate?.(text) ?? true;
        }}
        onPressEnter={onPressEnter}
      />
    </div>
  );
};

interface EmailProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string | null;
  cache?: boolean;
  onChange: (value: string) => void;
  inputClassName?: string;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  minlength?: number;
  maxlength?: number;
  onPressEnter?: () => void;
  inputStyleType?: "bordered" | "borderless" | "underline";
}
export const Email = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  cache,
  placeholder = "example@email.com",
  nullable,
  disabled,
  minlength = nullable ? 0 : 2,
  maxlength = 80,
  transform = (v) => v,
  validate,
  onPressEnter,
  inputClassName,
  inputStyleType,
}: EmailProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Input.Email
        {...agentAttrs(onChange)}
        value={value ?? ""}
        cacheKey={cache ? `${label}-${desc}-email` : undefined}
        nullable={nullable}
        placeholder={placeholder}
        onChange={(value) => {
          onChange(transform(value));
        }}
        disabled={disabled}
        className={cn("w-full", "")}
        inputClassName={cn("w-full focus:border-primary", inputClassName)}
        inputStyleType={inputStyleType}
        validate={(text: string) => {
          if (text.length < minlength) return l("base.textTooShortError", { minlength });
          else if (text.length > maxlength) return l("base.textTooLongError", { maxlength });
          else return validate?.(text) ?? true;
        }}
        onPressEnter={onPressEnter}
      />
    </div>
  );
};

interface PhoneProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string | null;
  onChange: (value: string) => void;
  inputClassName?: string;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  cache?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  minlength?: number;
  maxlength?: number;
  onPressEnter?: () => void;
}
export const Phone = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  placeholder,
  nullable,
  disabled,
  maxlength = 13,
  cache,
  transform = (v) => formatPhone(v),
  validate,
  onPressEnter,
  inputClassName,
}: PhoneProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();

  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Input
        {...agentAttrs(onChange)}
        value={value ?? ""}
        cacheKey={cache ? `${label}-${desc}-phone` : undefined}
        nullable={nullable}
        placeholder={placeholder}
        onChange={(value) => {
          onChange(transform(value));
        }}
        disabled={disabled}
        maxLength={maxlength}
        className={cn("w-full", "")}
        inputClassName={cn("w-full focus:border-primary", inputClassName)}
        validate={(text: string) => {
          if (!isPhoneNumber(text)) return l("base.phoneInvalidError");
          else return validate?.(text) ?? true;
        }}
        onPressEnter={onPressEnter}
      />
    </div>
  );
};

interface PasswordProps {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  value: string | null;
  onChange: (value: string) => void;
  confirmValue?: string | null;
  onChangeConfirm?: (value: string) => void;
  inputClassName?: string;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  cache?: boolean;
  transform?: (value: string) => string;
  validate?: (text: string) => boolean | string;
  minlength?: number;
  maxlength?: number;
  onPressEnter?: () => void;
  showConfirm?: boolean;
}
export const Password = ({
  label,
  desc,
  labelClassName,
  className,
  value,
  onChange,
  cache,
  confirmValue,
  onChangeConfirm,
  placeholder,
  nullable,
  disabled,
  minlength = nullable ? 0 : 8,
  maxlength = 20,
  transform = (v) => v,
  validate,
  onPressEnter,
  inputClassName,
  showConfirm,
}: PasswordProps) => {
  useFieldTool(onChange, { transform, disabled });
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <div className="flex flex-col gap-2">
        <Input.Password
          {...agentAttrs(onChange)}
          cacheKey={cache ? `${label}-${desc}-password` : undefined}
          value={value ?? ""}
          nullable={nullable}
          placeholder={placeholder ?? l("base.password")}
          onChange={(value) => {
            onChange(transform(value));
          }}
          disabled={disabled}
          className={cn("w-full", "")}
          inputClassName={cn("w-full focus:border-primary", inputClassName)}
          validate={(text: string) => {
            if (text.length < minlength) return l("base.textTooShortError", { minlength });
            else if (text.length > maxlength) return l("base.textTooLongError", { maxlength });
            else return validate?.(text) ?? true;
          }}
          onPressEnter={onPressEnter}
        />
        {showConfirm ? (
          <Input.Password
            value={confirmValue ?? ""}
            nullable={nullable}
            placeholder={l("base.passwordConfirm")}
            onChange={(value) => onChangeConfirm?.(transform(value))}
            disabled={disabled}
            className={cn("w-full", "")}
            inputClassName={cn("w-full focus:border-primary", inputClassName)}
            validate={(text: string) => {
              if (value && text !== value) return l("base.passwordNotMatchError");
              else return true;
            }}
            onPressEnter={onPressEnter}
          />
        ) : null}
      </div>
    </div>
  );
};
