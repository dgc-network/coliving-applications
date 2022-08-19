# `eslint-config-`

A neat setup for eslint & prettier by the Coliving team <3

## Install

`npm i -D eslint-config-`

Note: Be sure to install all of the peer dependencies

## Usage

```
{
  "extends": ''
}
```

If using prettier formatter separately from eslint, be sure to add this to your `.prettierrc` file:

```
module.exports = {
  ...require('eslint-config-/.prettierc')
}
```
