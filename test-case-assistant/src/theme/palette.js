import { createLightTheme, createDarkTheme } from '@fluentui/react-components'

// Deep teal ramp with warm amber accents for an enterprise QA workspace.
export const brandRamp = {
  10: '#031716',
  20: '#082b29',
  30: '#0b403c',
  40: '#0d5751',
  50: '#0f6d65',
  60: '#0d8176',
  70: '#0b9587',
  80: '#08a99a',
  90: '#27b9a9',
  100: '#4dc8b9',
  110: '#70d6c9',
  120: '#91e1d7',
  130: '#b0ebe3',
  140: '#c9f1eb',
  150: '#dff7f3',
  160: '#effbf9',
}

export const semanticPalette = {
  success: '#107c10',
  warning: '#f7630c',
  danger: '#c50f1f',
  info: '#0b8176',
  neutral: '#616161',
}

export const chartPalette = [
  '#0b8176',
  '#d97706',
  '#2563eb',
  '#c2415a',
  '#64748b',
  '#0891b2',
  '#8b6f47',
]

export const lightTheme = createLightTheme(brandRamp)
export const darkTheme = createDarkTheme(brandRamp)
