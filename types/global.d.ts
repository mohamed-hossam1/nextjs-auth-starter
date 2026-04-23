/**
 * Re-export the canonical `ActionResult` (and friends) from the new
 * actionHandler so existing `import type { ActionResult } from "@/types/global"`
 * call sites keep working.
 */
import type {
  ActionFailure as _ActionFailure,
  ActionResult as _ActionResult,
  ActionSuccess as _ActionSuccess,
} from "@/lib/actionHandler/types";

export type ActionResult<T = void> = _ActionResult<T>;
export type ActionSuccess<T = void> = _ActionSuccess<T>;
export type ActionFailure = _ActionFailure;
