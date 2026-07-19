const path = require('path');
const mod = require('module');

const baseUrl = path.resolve(__dirname, 'dist');

const aliases = {
  '@/*': ['./*'],
  '@config/*': ['./config/*'],
  '@models/*': ['./models/*'],
  '@controllers/*': ['./controllers/*'],
  '@routes/*': ['./routes/*'],
  '@middlewares/*': ['./middlewares/*'],
  '@utils/*': ['./utils/*'],
  '@interfaces/*': ['./interfaces/*'],
};

const originalResolve = mod._resolveFilename;

mod._resolveFilename = function (request, parent, isMain, options) {
  for (const [alias, targets] of Object.entries(aliases)) {
    const starIdx = alias.indexOf('*');
    if (starIdx !== -1) {
      const prefix = alias.slice(0, starIdx);
      if (request.startsWith(prefix)) {
        const rest = request.slice(prefix.length);
        for (const target of targets) {
          const targetStarIdx = target.indexOf('*');
          const relativePath = targetStarIdx !== -1
            ? target.slice(0, targetStarIdx) + rest
            : target;
          const fullPath = path.resolve(baseUrl, relativePath);
          try {
            return originalResolve.call(mod, fullPath, parent, isMain, options);
          } catch {}
        }
      }
    } else if (request === alias) {
      for (const target of targets) {
        const fullPath = path.resolve(baseUrl, target);
        try {
          return originalResolve.call(mod, fullPath, parent, isMain, options);
        } catch {}
      }
    }
  }
  return originalResolve.call(mod, request, parent, isMain, options);
};
