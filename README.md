<p align="center">
  <br/>
  <a target="_blank" href="https://coliving.co">
    <img src="https://user-images.githubusercontent.com/2731362/90302695-e5ae8a00-de5c-11ea-88b5-24c1408affc6.png" alt="coliving-client" width="300">
  </a>
  <br/>

  <p align="center">
    The Coliving Client Monorepo
    <br/>
    🎧🎸🎹🤘🎶🥁🎷🎻🎤🔊
  </p>
</p>

<br/>
<br/>

[![CircleCI](https://circleci.com/gh/dgc.network/coliving-client.svg?style=svg)](https://circleci.com/gh/dgc.network/coliving-client)
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
