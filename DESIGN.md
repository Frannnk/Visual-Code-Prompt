# Runtime Interaction Spec Layer Design Rules

This project adopts the high-level visual rules from the Figma `DESIGN.md` in [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) and adapts them to this runtime spec tool demo.

## Adopted Principles

1. Interface chrome stays black and white.
2. Color appears mainly in hero content, not in tool chrome.
3. Interactive controls use pill (`50px`) or circular (`50%`) geometry.
4. Focus indicators use dashed outlines instead of solid outlines.
5. Typography stays tight with slightly negative letter-spacing on major UI text.
6. Toolbar and inspector should feel like floating Figma tool surfaces.

## Practical Adaptations

1. `figmaSans` is approximated with `Inter` and system fallbacks in this demo.
2. Toolbar and panel use monochrome surfaces with glass-like white elevation.
3. Edit handles remain blue for edit affordance, but the main chrome stays monochrome.
4. Hero area keeps a multi-color gradient to represent creative output, while the runtime layer remains neutral.
