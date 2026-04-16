import { ActionResult } from "@/types/global";
import { AppError } from "./error";

export async function handleAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
      };
    }
    const cause = (error as Error & { cause?: unknown }).cause;
    console.error("CAUSE: ", cause);
    console.error("ERROR: ", error);

    return {
      success: false,
      message: `Something went wrong`,
      statusCode: 500,
    };
  }
}
