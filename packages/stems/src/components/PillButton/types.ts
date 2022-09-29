import { ButtonProps } from 'components/button'

export enum Variant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

export type PillButtonProps = ButtonProps & {
  variant: Variant
}
