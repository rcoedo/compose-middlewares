/**
 * Recursive version of koa-compose/mali-compose. It has the exact same API and can be used as a replacement.
 */

const fail = () => {
  throw new Error("next() should only be called once");
};

// function decorator. returns a function that throws an error after the first call to the decorated function.
const once = decorated => {
  if (!decorated) {
    return decorated;
  }

  let current = decorated;

  return (...args) => {
    const result = current(...args); // Will throw after the first call.
    current = fail;
    return result;
  };
};

const composeMiddlewares = middlewares => {
  if (!Array.isArray(middlewares)) {
    throw new TypeError("Middleware stack must be an array!");
  }

  if (middlewares.some(fn => typeof fn !== "function")) {
    throw new TypeError("Middleware stack must be composed of functions!");
  }

  const compose = async (ctx, [fn, ...rest]) => (fn ? await fn(ctx, once(compose.bind(null, ctx, rest))) : null);

  return async (ctx, next) =>
    compose(
      ctx,
      [...middlewares, once(next)],
    );
};

module.exports = composeMiddlewares;
