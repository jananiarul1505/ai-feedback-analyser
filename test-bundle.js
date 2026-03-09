const fs = require('fs');
global.document = {
  getElementById: () => ({ style: {} }),
  createElement: () => ({ style: {} })
};
global.window = {
  location: {},
  addEventListener: () => {}
};
global.navigator = { userAgent: 'node' };

const bundle = fs.readdirSync('./dist/assets').find(f => f.endsWith('.js'));
import('./dist/assets/' + bundle).catch(e => console.error("Caught error:", e));
