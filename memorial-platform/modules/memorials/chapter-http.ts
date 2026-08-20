import { jsonError, jsonUnprocessable } from "@/lib/api";
import type { ChapterError } from "./life-chapters";

/**
 * Maps a life-chapter refusal onto a response.
 *
 * Shared by every chapter route so they cannot describe the same refusal
 * differently. `CHAPTER_NOT_FOUND` answers the same as a missing memorial:
 * whether a chapter exists is not disclosed to someone who may not edit it.
 */
export function refuseChapterError(
  error: ChapterError,
  correlationId: string,
): Response {
  switch (error) {
    case "AUTH_REQUIRED":
      return jsonError("AUTH_REQUIRED", correlationId);
    case "MEMORIAL_NOT_FOUND":
    case "CHAPTER_NOT_FOUND":
    case "MEDIA_NOT_FOUND":
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    case "MEMORIAL_FORBIDDEN":
      return jsonError("MEMORIAL_FORBIDDEN", correlationId);
    case "INVALID_CHAPTER_KEY":
      return jsonUnprocessable(correlationId, {
        chapterKey: ["Unknown chapter."],
      });
    case "DUPLICATE_CHAPTER":
      return jsonUnprocessable(correlationId, {
        chapterKey: ["This chapter already exists."],
      });
    case "EMPTY_BODY":
      return jsonUnprocessable(correlationId, {
        body: ["Please write something before saving."],
      });
    case "NOTHING_TO_PUBLISH":
      return jsonUnprocessable(correlationId, {
        _: ["There is no saved draft to publish."],
      });
  }
}
