import type { ComponentProps } from "react";

type NativeDateInputProps = Omit<ComponentProps<"input">, "type"> & {
  type?: "date" | "datetime-local";
};

export function NativeDateInput({ type = "date", ...props }: NativeDateInputProps) {
  // iOS can add native date-control padding outside a 100% input width.
  // Keep the decoration on a separate box and preserve the native picker.
  return (
    <span className="native-date-field">
      <input {...props} type={type} />
    </span>
  );
}
