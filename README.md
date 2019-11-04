# compose-middlewares

compose-middlewares is a refactored version of [koa-compose](https://github.com/koajs/compose)/[mali-compose](https://github.com/malijs/mali-compose).

## Installation

```
$ npm install compose-middlewares
```

```
$ yarn add compose-middlewares
```

## API

compose-middlewares uses the same koa-compose/mali-compose API, so you could use it as a replacement. The test suite is a refactored version of koa-compose's test suite so everything will work as intended.

### compose([a, b, c, ...])

Returns a new middleware, result of composing the stack of middlewares.

## License

MIT
