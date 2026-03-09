const fs = require('fs');
global.document = {
  getElementById: () => ({ style: {} }),
  createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {} }),
  querySelectorAll: () => [],
  head: { appendChild: () => {} },
  body: { appendChild: () => {} }
};
global.window = {
  location: {},
  addEventListener: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  dispatchEvent: () => {}
};
global.navigator = { userAgent: 'node' };
global.self = global;
global.MutationObserver = class { observe() {} disconnect() {} };
global.HTMLElement = class {};
global.localStorage = { getItem: () => null, setItem: () => {} };

const bundle = fs.readdirSync('./dist/assets').find(f => f.endsWith('.js'));
import('./dist/assets/' + bundle).catch(e => console.error("Caught error:", e));
