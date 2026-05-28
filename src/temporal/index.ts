import {
  withDurableExecution,
  type DurableContext,
  createRetryStrategy,
  StepConfig,
} from "@aws/durable-execution-sdk-js";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { traceAsync } from "../shared/trace";

const QUEUE_URL = process.env.PROCESSING_QUEUE_URL;

export const sqsClient = new SQSClient({});


const retryStepConfig: StepConfig<string> = {
  retryStrategy: createRetryStrategy({
    maxAttempts: 5,
    initialDelay: { seconds: 2 },
    maxDelay: { minutes: 1 },
    backoffRate: 2,
  }),
};

// const stepConfig: StepConfig<string> = {
//   retryStrategy: createRetryStrategy({
//     retryableErrorTypes: [],
//     retryableErrors: [],
//   }),
// };


export const handler = withDurableExecution(
  async (event: unknown, context: DurableContext) => {
    const logged = await traceAsync("log-event", async (subsegment) => {
      const result = await context.step("log-event", async () => {
        const payload = JSON.stringify(event);
        context.logger.info("durable-stack", { payload });
        return payload;
      }, 
      retryStepConfig,
      );

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

    // await traceAsync("raise-error", async (subsegment) => {
    //   subsegment?.addAnnotation("raises", true);

    //   await context.step(
    //     "raise-error",
    //     async () => {
    //       throw new Error("Intentional failure from raise-error step");
    //     },
    //     stepConfig,
    //   );
    // });

    const submitToFifo = async (callbackId: string) => {
      if (!QUEUE_URL) {
        throw new Error("PROCESSING_QUEUE_URL is not set");
      }

      const payload =
        typeof event === "object" &&
        event !== null &&
        "data" in event
          ? (event as { data: unknown }).data
          : event;

      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({ callbackId, payload }),
          MessageGroupId: "DurableProcessingGroup",
        }),
      );
    };

    const result = await context.waitForCallback(
      "AwaitWorkerCallback",
      submitToFifo,
      { timeout: { seconds: 300 } },
    );

    return { ok: true, logged, random, result };
  },
);
