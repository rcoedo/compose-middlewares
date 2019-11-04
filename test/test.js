/**
 * This test suit is a refactored version of the koa-compose test suite.
 */

const compose = require("../index.js");

const wait = ms => new Promise(resolve => setTimeout(resolve, ms || 1));

describe("Compose Middlewares", () => {
  it("should work", async () => {
    const ctx = { arr: [] };
    const mw = (before, after) => async (ctx, next) => {
      ctx.arr.push(before);
      await wait(1);
      await next();
      await wait(1);
      ctx.arr.push(after);
    };

    await compose([mw(1, 6), mw(2, 5), mw(3, 4)])(ctx);

    expect(ctx).toEqual({ arr: [1, 2, 3, 4, 5, 6] });
  });

  it("should be able to be called twice", async () => {
    const ctx1 = { arr: [] };
    const ctx2 = { arr: [] };
    const mw = (before, after) => async (ctx, next) => {
      ctx.arr.push(before);
      await wait(1);
      await next();
      await wait(1);
      ctx.arr.push(after);
    };

    const fn = compose([mw(1, 6), mw(2, 5), mw(3, 4)]);

    await fn(ctx1);
    expect(ctx1).toEqual({ arr: [1, 2, 3, 4, 5, 6] });

    await fn(ctx2);
    expect(ctx2).toEqual({ arr: [1, 2, 3, 4, 5, 6] });
  });

  it("should only accept an array", () => {
    expect(() => {
      compose();
    }).toThrowErrorMatchingInlineSnapshot(`"Middleware stack must be an array!"`);
  });

  it("should create next functions that return a Promise", () => {
    const ctx = { arr: [] };
    const mw = () => (ctx, next) => ctx.arr.push(next());

    compose([mw(), mw(), mw(), mw(), mw()])(ctx);

    ctx.arr.forEach(n => expect(n).toBeInstanceOf(Promise));
  });

  it("should work with 0 middleware", () => {
    compose([])({});
  });

  it("should only accept middleware as functions", () => {
    expect(() => compose([{}])).toThrowErrorMatchingInlineSnapshot(`"Middleware stack must be composed of functions!"`);
  });

  it("should work when yielding at the end of the stack", async () => {
    const fn = jest.fn();

    await compose([
      async (ctx, next) => {
        await next();
        fn();
      },
    ])({});

    expect(fn).toHaveBeenCalled();
  });

  it("should reject on errors in middleware", async () => {
    expect.assertions(1);
    try {
      await compose([
        () => {
          throw new Error("Middleware error");
        },
      ])({});
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Middleware error]`);
    }
  });

  it("should work when yielding at the end of the stack with yield*", () => {
    expect(() =>
      compose([
        async (ctx, next) => {
          await next;
        },
      ])({}),
    ).not.toThrow();
  });

  it("should keep the context", () => {
    const ctx = {};

    const mw = () => async (ctx2, next) => {
      await next();
      expect(ctx2).toEqual(ctx);
    };

    compose([mw(), mw(), mw(), mw()])(ctx);
  });

  it("should catch downstream errors", async () => {
    const ctx = { arr: [] };

    await compose([
      async (ctx, next) => {
        ctx.arr.push(1);
        try {
          ctx.arr.push(6);
          await next();
          ctx.arr.push(7);
        } catch (err) {
          ctx.arr.push(2);
        }
        ctx.arr.push(3);
      },

      async (ctx, next) => {
        ctx.arr.push(4);
        throw new Error();
      },
    ])(ctx);

    expect(ctx.arr).toEqual([1, 6, 4, 2, 3]);
  });

  it("should compose w/ next", async () => {
    const fn = jest.fn();

    await compose([])({}, fn);

    expect(fn).toHaveBeenCalled();
  });

  it("should compose w/ other compositions", async () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();

    await compose([
      compose([
        async (ctx, next) => {
          fn1();
          await next();
        },
        async (ctx, next) => {
          fn2();
          await next();
        },
      ]),
      async (ctx, next) => {
        fn3();
        await next();
      },
    ])({});

    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
    expect(fn3).toHaveBeenCalled();
  });

  it("should throw if next() is called multiple times", async () => {
    expect.assertions(1);
    try {
      await compose([
        async (ctx, next) => {
          await next();
          await next();
        },
      ])({});
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: next() should only be called once]`);
    }
  });

  it("should return last return value", async () => {
    const result = await compose([
      async (context, next) => {
        expect(await next()).toEqual(1);
        return 2;
      },

      async (context, next) => {
        expect(await next()).toEqual(0);
        return 1;
      },
    ])({}, () => 0);

    expect(result).toEqual(2);
  });

  it("should not affect the original middleware array", () => {
    const middleware = (ctx, next) => {
      next();
    };

    const stack = [middleware];

    expect(stack).toEqual([middleware]);

    compose(stack);

    expect(stack).toEqual([middleware]);
  });

  it("should not get stuck on the passed in next", async () => {
    const fn = jest.fn();
    const next = jest.fn();

    await compose([
      async (ctx, next) => {
        fn();
        await next();
      },
    ])({}, next);

    expect(fn).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
