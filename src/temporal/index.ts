import {
  withDurableExecution,
  type DurableContext,
} from "@aws/durable-execution-sdk-js";
import { traceAsync } from "../shared/trace";

export const handler = withDurableExecution(
  async (event: unknown, context: DurableContext) => {
    const logged = await traceAsync("log-event", async (subsegment) => {
      const result = await context.step("log-event", async () => {
        const payload = JSON.stringify(event);
        context.logger.info("durable-stack", { payload });
        return payload;
      }, {
        retryStrategy: (error, attempt) => ({
          shouldRetry: attempt < 3,
          delay: { seconds: Math.pow(2, attempt) },
        }),
      });

      if (subsegment) {
        const annotation =
          result.length > 64 ? `${result.slice(0, 61)}...` : result;
        subsegment.addAnnotation("logged", annotation);
      }

      return result;
    });

    const random = await traceAsync("random-number", async (subsegment) => {
      const result = await context.step("random-number", async () => {
        const value = Math.floor(Math.random() * 1_000_000);
        context.logger.info("durable-stack", { random: value });
        return value;
      });

      subsegment?.addAnnotation("random", result);

      return result;
    });

    await traceAsync("raise-error", async (subsegment) => {
      subsegment?.addAnnotation("raises", true);

      await context.step("raise-error", async () => {
        throw new Error("Intentional failure from raise-error step");
      });
    });

    return { ok: true, logged, random };
  },
);
