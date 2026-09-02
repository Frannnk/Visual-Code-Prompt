import { specDocument } from './spec-runtime';
import { mountRuntimeSpecInjector, registerRuntimeSpecInjector } from './injector';

registerRuntimeSpecInjector();

if (typeof window !== 'undefined') {
  window.RuntimeSpecLayer = {
    mount: (options) =>
      mountRuntimeSpecInjector({
        spec: options.spec ?? specDocument,
        pageState: options.pageState,
        targetDocument: options.targetDocument
      })
  };
}
