import {
  withDurableExecution,
  type DurableContext,
} from "@aws/durable-execution-sdk-js";

export const handler = withDurableExecution(
  async (event: unknown, context: DurableContext) => {
    const logged = await context.step("log-event", async () => {
      const payload = JSON.stringify(event);
      context.logger.info("durable-stack", { payload });
      return payload;
    }, {
      retryStrategy: (error, attempt) => ({
        shouldRetry: attempt < 3,
        delay: { seconds: Math.pow(2, attempt) },
      }),
    });

    return { ok: true, logged };
  },
);
