import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
const code = stripTypeScriptTypes(
  await readFile(
    new URL("../apps/web/src/lib/editor-keyboard.ts", import.meta.url),
    "utf8",
  ),
);
const { saveOnEnter, submitEditorOnEnter } = await import(
  "data:text/javascript," + encodeURIComponent(code)
);
let saved = 0;
function event(patch = {}) {
  return {
    key: "Enter",
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    defaultPrevented: false,
    nativeEvent: { isComposing: false, keyCode: 13 },
    preventDefault() {
      this.defaultPrevented = true;
    },
    ...patch,
  };
}
const enter = event();
saveOnEnter(enter, () => saved++);
assert.equal(saved, 1);
assert(enter.defaultPrevented);
for (const patch of [
  { shiftKey: true },
  { ctrlKey: true },
  { altKey: true },
  { metaKey: true },
  { key: "Tab" },
  { key: "Escape" },
  { key: "ArrowDown" },
  { defaultPrevented: true },
  { nativeEvent: { isComposing: true, keyCode: 13 } },
  { nativeEvent: { isComposing: false, keyCode: 229 } },
]) {
  const e = event(patch);
  saveOnEnter(e, () => saved++);
  assert.equal(saved, 1, `Unexpected save for ${JSON.stringify(patch)}`);
  if (!patch.defaultPrevented)
    assert(
      !e.defaultPrevented,
      "Native navigation, newline or IME was blocked",
    );
}
for (const [patch, busy] of [
  [{ repeat: true }, false],
  [{}, true],
]) {
  const e = event(patch);
  saveOnEnter(e, () => saved++, busy);
  assert.equal(saved, 1);
  assert(
    e.defaultPrevented,
    "Repeated/pending Enter must not insert a newline",
  );
}
let requests = 0;
let valid = false;
const form = {
  requestSubmit() {
    requests++;
    if (valid) saved++;
  },
};
function formEvent(tagName, type = "text", patch = {}) {
  return event({
    currentTarget: form,
    target: { tagName, type, form },
    ...patch,
  });
}
submitEditorOnEnter(formEvent("INPUT"));
assert.equal(requests, 1);
assert.equal(
  saved,
  1,
  "Form validation must remain in the browser's requestSubmit path",
);
valid = true;
submitEditorOnEnter(formEvent("TEXTAREA"));
assert.equal(requests, 2);
assert.equal(saved, 2);
for (const [tag, type] of [
  ["BUTTON", "submit"],
  ["SELECT", "select-one"],
  ["A", ""],
  ["INPUT", "file"],
  ["INPUT", "checkbox"],
  ["INPUT", "date"],
  ["INPUT", "range"],
]) {
  const e = formEvent(tag, type);
  submitEditorOnEnter(e);
  assert(
    !e.defaultPrevented,
    `Native ${tag}/${type} activation was intercepted`,
  );
}
assert.equal(requests, 2);
const newline = formEvent("TEXTAREA", "textarea", { shiftKey: true });
submitEditorOnEnter(newline);
assert(!newline.defaultPrevented);
const singleLineShift = formEvent("INPUT", "text", { shiftKey: true });
submitEditorOnEnter(singleLineShift);
assert(singleLineShift.defaultPrevented);
assert.equal(requests, 2);
console.log(
  "Keyboard checks passed: Enter save, Shift+Enter newline, Korean IME/229, repeat/busy guards, native controls, Tab/Escape/arrows and form validation.",
);
