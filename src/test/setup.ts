import 'fake-indexeddb/auto';

class CustomEventPolyfill<T = unknown> extends Event {
  readonly detail: T;

  constructor(type: string, eventInitDict?: CustomEventInit<T>) {
    super(type, eventInitDict);
    this.detail = (eventInitDict?.detail ?? undefined) as T;
  }
}

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = CustomEventPolyfill as typeof CustomEvent;
}
