import 'styled-components/native'
import theme from '@theme/index'

declare module 'styled-components' {
  type Theme = typeof theme;
  export interface DefaultTheme extends Theme {}
}