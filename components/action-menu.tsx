"use client";

import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

export type MenuAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function ActionMenu({ items, label }: {
  items: MenuAction[];
  label: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = useRef<(() => void) | null>(null);
  return <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild>
      <button ref={trigger} type="button" className="icon-button action-menu-trigger" aria-label={label} title={label}>
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="action-menu-content" align="end" sideOffset={8} collisionPadding={12}
        onCloseAutoFocus={event => {
          // Restore the menu trigger before opening a dialog so its focus returns here too.
          if (!selected.current) return;
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
          const action = selected.current;
          selected.current = null;
          action();
        }}>
        {items.map((item, index) => <DropdownMenu.Item key={index} className={`action-menu-item${item.danger ? " danger-text" : ""}`} disabled={item.disabled}
          onSelect={() => { selected.current = item.onSelect; }}>
          {item.icon && <item.icon size={17} aria-hidden="true" />}
          <span>{item.label}</span>
        </DropdownMenu.Item>)}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
