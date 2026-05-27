import AWSXRay from "aws-xray-sdk-core";

export interface ITraceOptions {
  namespace?: string;
  annotations?: Record<string, string | number | boolean>;
  metadata?: Record<string, any>;
}

/**
 * Wraps an async function in an X-Ray subsegment.
 * Handles opening, closing, and error reporting.
 */
export async function traceAsync<T>(
  name: string,
  fn: (subsegment?: AWSXRay.Subsegment) => Promise<T>,
  options: ITraceOptions = {},
): Promise<T> {
  return await AWSXRay.captureAsyncFunc(name, async (subsegment) => {
    try {
      if (subsegment) {
        const { annotations, metadata, namespace = "log-stream-processor" } = options;

        if (annotations) {
          for (const [key, value] of Object.entries(annotations)) {
            // Annotations are limited to 64 chars to avoid X-Ray limits
            const processedValue =
              typeof value === "string" && value.length > 64
                ? value.substring(0, 61) + "..."
                : value;
            subsegment.addAnnotation(key, processedValue);
          }
        }

        if (metadata) {
          for (const [key, value] of Object.entries(metadata)) {
            // Potential long strings are handled by the user's logic before passing here,
            // or we could add a length check here if needed.
            subsegment.addMetadata(key, value, namespace);
          }
        }
      }

      return await fn(subsegment);
    } catch (error) {
      if (subsegment) {
        subsegment.addError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    } finally {
      subsegment?.close();
    }
  });
}
