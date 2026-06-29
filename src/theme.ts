import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Single source of truth for the app accent: a clean violet ramp (solid = brand.600).
// Used everywhere via colorPalette="brand". Retune the accent here only.
const customConfig = defineConfig({
  theme: {
    // Standardize form-control sizing: default to "sm" so buttons/inputs match the
    // dense sm tables/nav. Set here once — do NOT sprinkle size="sm" per control.
    // Explicit sizes (e.g. size="xs" on table row actions) still override.
    // Cast to any: Chakra's generic recipe types only type `colorPalette` in
    // defaultVariants (they can't infer per-recipe variant keys from a partial
    // override). Runtime merge into the base recipe is unaffected.
    recipes: {
      button: { defaultVariants: { size: "sm" } },
      input: { defaultVariants: { size: "sm" } },
      textarea: { defaultVariants: { size: "sm" } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    slotRecipes: {
      select: { defaultVariants: { size: "sm" } },
      combobox: { defaultVariants: { size: "sm" } },
      nativeSelect: { defaultVariants: { size: "sm" } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    tokens: {
      colors: {
        brand: {
          50: { value: "#f5f3ff" },
          100: { value: "#ede9fe" },
          200: { value: "#ddd6fe" },
          300: { value: "#c4b5fd" },
          400: { value: "#a78bfa" },
          500: { value: "#8b5cf6" },
          600: { value: "#7c3aed" },
          700: { value: "#6d28d9" },
          800: { value: "#5b21b6" },
          900: { value: "#4c1d95" },
          950: { value: "#2e1065" },
        },
      },
    },
    semanticTokens: {
      // Virtual tokens that colorPalette="brand" resolves on every Chakra component.
      colors: {
        brand: {
          contrast: { value: { _light: "white", _dark: "white" } },
          fg: { value: { _light: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          subtle: { value: { _light: "{colors.brand.50}", _dark: "{colors.brand.900}" } },
          muted: { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.800}" } },
          emphasized: { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.700}" } },
          solid: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.600}" } },
          focusRing: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.500}" } },
          border: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
        },
      },
    },
  },
  // Pin the white canvas regardless of any future color-mode class.
  globalCss: {
    "html, body": {
      bg: "white",
      color: "gray.900",
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
