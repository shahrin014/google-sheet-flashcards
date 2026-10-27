## Context

The rating controls currently live in the card flow beneath the flashcard. On short viewports they fall below the fold, and their flat Mantine light buttons do not read as a clear choice hierarchy.

## Decisions

1. **Fixed bottom bar.** Revealed cards render the ratings in a `position: fixed` bar with a blurred surface and an 860px inner container. `main` reserves bottom space so the bar never covers card content.
2. **One-row grid.** Four `minmax(0, 1fr)` columns keep the actions on one row. Labels use `clamp()` font sizes and `white-space: nowrap`, so long intervals shrink instead of wrapping.
3. **Key, name, interval stack.** Each button shows the number key, the rating name, and the interval in a compact vertical stack. This keeps the rating name visible and leaves horizontal room for the interval.
4. **Color tokens.** Rating colors are CSS variables with separate light/dark values. Tinted backgrounds and bordered buttons keep contrast readable without relying on color alone.

## Risks / Trade-offs

- Very narrow screens will use the smallest label size. Accepted: the actions stay reachable and the text remains legible.
- The bar overlays the viewport instead of the document. Accepted: reserved padding prevents card overlap.
