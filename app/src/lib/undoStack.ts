// Module-level undo stack for autosaved table fields (CurrencyInput,
// AutoSubmitField). Each entry records the value a field held immediately
// before an autosave overwrote it, keyed by the hidden <form> id + input
// name so a listener can find the live DOM node and resubmit the old value.
export type UndoEntry = { formId: string; fieldName: string; prevValue: string };

const stack: UndoEntry[] = [];

export function pushUndo(entry: UndoEntry) {
  stack.push(entry);
  if (stack.length > 50) stack.shift();
}

export function popUndo(): UndoEntry | undefined {
  return stack.pop();
}
