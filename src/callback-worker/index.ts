import {
  processPartialResponse,
  SqsFifoPartialProcessorAsync,
} from "@aws-lambda-powertools/batch";
import { Logger } from "@aws-lambda-powertools/logger";
import {
  LambdaClient,
  SendDurableExecutionCallbackSuccessCommand,
} from "@aws-sdk/client-lambda";
import type { SQSHandler, SQSRecord } from "aws-lambda";
import { traceAsync } from "../shared/trace";

const processor = new SqsFifoPartialProcessorAsync();
const logger = new Logger();
const lambda = new LambdaClient({});

const recordHandler = async (record: SQSRecord): Promise<void> => {
  await traceAsync(
    "process-callback",
    async (subsegment) => {
      const { callbackId, payload } = JSON.parse(record.body) as {
        callbackId: string;
        payload: unknown;
      };

      logger.info("Processing payload", { callbackId, payload });

      await new Promise(r => setTimeout(r, 15000));

      const processedResult = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      await lambda.send(
        new SendDurableExecutionCallbackSuccessCommand({
          CallbackId: callbackId,
          Result: Buffer.from(JSON.stringify(processedResult)),
        }),
      );

      subsegment?.addAnnotation("callbackId", callbackId);
    },
    {
      annotations: {
        messageId: record.messageId,
        messageGroupId: record.attributes?.MessageGroupId ?? "unknown",
      },
    },
  );
};

export const handler: SQSHandler = async (event, context) =>
  traceAsync(
    "callback-worker-batch",
    async () =>
      processPartialResponse(event, recordHandler, processor, {
        context,
      }),
    {
      annotations: { recordCount: event.Records.length },
    },
  );
