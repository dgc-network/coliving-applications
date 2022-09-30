# The Coliving Applications Monorepo
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Packages

| Name                          | Description                              |
| ----------------------------- | ---------------------------------------- |
| [`web`](./packages/web)       | The decentralized Coliving web application |
| [`mobile`](./packages/mobile) | The Coliving mobile application            |
| [`stems`](./packages/stems)   | The Coliving client component library      |

### Getting Started

This repo is maintained using [`lerna`](https://github.com/lerna). After cloning run:

```bash
npm install
```

This will do the following:

- Install root dependencies
- Install all package dependencies using `lerna bootstrap`
- Initialize git hooks (`npx @escape.tech/mookme init --only-hook --skip-types-selection`)
