import type { KeyboardEvent } from "react";

type EnterEvent = {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  defaultPrevented: boolean;
  nativeEvent: { isComposing: boolean; keyCode: number };
  preventDefault: () => void;
};

// Composition confirmation belongs to the IME, especially on Korean/Japanese keyboards.
export function composing(event: EnterEvent) {
  return event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;
}

export function saveOnEnter(event: EnterEvent, save: () => void, busy = false) {
  if (
    event.defaultPrevented ||
    event.key !== "Enter" ||
    composing(event) ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  if (!busy && !event.repeat) save();
}

export function submitEditorOnEnter(
  event: KeyboardEvent<HTMLFormElement>,
  busy = false,
) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const textInput =
    target.tagName === "INPUT" &&
    ["text", "search", "email", "url", "tel", "password", "number"].includes(
      target.type,
    );
  if (target.tagName !== "TEXTAREA" && !textInput) return;
  if (target.form !== event.currentTarget) return;
  if (
    textInput &&
    event.key === "Enter" &&
    event.shiftKey &&
    !composing(event)
  ) {
    event.preventDefault();
    return;
  }
  saveOnEnter(event, () => event.currentTarget.requestSubmit(), busy);
}
