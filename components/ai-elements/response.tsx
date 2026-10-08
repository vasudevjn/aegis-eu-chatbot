"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { createMathPlugin } from "@streamdown/math";
import { aegisRenderers, TableCell } from "@/components/messages/aegis-blocks";
import { markUnfinishedBlocks } from "@/lib/aegis-blocks";

// enable inline $...$ math (plugin default only renders $$...$$ display math)
const math = createMathPlugin({ singleDollarTextMath: true });

type ResponseProps = ComponentProps<typeof Streamdown>;

// Allow all elements to render (override rehype-harden default blocking)
const allowElement = () => true;

/**
 * Sanitize response text before rendering:
 * - Remove [blocked] artifacts from empty markdown links
 * - Remove empty markdown links like [text]() that cause [blocked]
 */
function sanitizeResponseText(text: string, streaming = false): string {
  if (!text) return text;
  let s = text;
  // While a reply is streaming, a structured block (summary card / next-step buttons) that has
  // no closing fence yet would render half-parsed. Mark it so the card shows its loading
  // skeleton instead; once the fence closes the real card replaces it.
  if (streaming) s = markUnfinishedBlocks(s);
  // Remove markdown links with empty URLs: [text]() → text
  s = s.replace(/\[([^\]]+)\]\(\s*\)/g, "$1");
  // Remove [blocked] text
  s = s.replace(/ ?\[blocked\]/g, "");
  return s;
}

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "aegis-prose size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      // renderers: the assessment card and next-step buttons (lib/aegis-blocks.ts);
      // td: priority badges (P0/P1/P2) in the action plan table.
      plugins={{ code, math, renderers: aegisRenderers }}
      components={{ td: TableCell }}
      animated
      allowElement={allowElement}
      {...props}
    >
      {typeof children === "string" ? sanitizeResponseText(children, !!props.isAnimating) : children}
    </Streamdown>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
