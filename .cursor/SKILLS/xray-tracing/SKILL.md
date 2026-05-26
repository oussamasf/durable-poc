---
name: xray-tracing
description: Instrument AWS Lambda code with X-Ray subsegments using the shared traceAsync helper. Use when adding tracing, instrumenting network calls, debugging observability, or extending X-Ray coverage to new Lambdas in this repo.
---

# X-Ray Tracing

This repo uses AWS X-Ray for observability. Lambda has `Tracing: Active` in SAM; runtime instrumentation is done via a shared helper and consistent segment naming.

## Shared tracer API

- **Location:** `src/shared/trace.ts`
- **Usage:** `traceAsync(name, fn, options?)`

```ts
import { traceAsync } from "../shared/trace";

await traceAsync(
  "stageName.operationName",
  async (subsegment) => {
    subsegment?.addAnnotation("eventId", eventId);
    return doWork();
  },
  {
    namespace: "requestReceived",
    annotations: { eventId, classId },
    metadata: { recordCount: 1, payloadSize: 100 },
  },
);
```

- **Options**
  - `annotations`: key/value for filtering in X-Ray (string, number, boolean only).
  - `metadata`: arbitrary JSON under a namespace for debugging.
  - `namespace`: namespace for metadata (default `"dispatcher"`). Use one per stage (e.g. `selectHomework`, `requestReceived`).
- **Behavior:** Runs `fn` inside `AWSXRay.captureAsyncFunc`, applies annotations/metadata to the subsegment, calls `addError` on throw, and always closes the subsegment in `finally`.

## Naming conventions

- **Segment names:** `stageName.operationName` (e.g. `requestReceived.parseAndValidateEvent`, `selectHomework.process`).
- **Stage prefix:** One prefix per Lambda/stage so traces group cleanly.
- **Operation:** Short, snake_case description (parseAndValidateEvent, persistTelemetry, enqueueSelectHomework, mongo.connect, questionService.head).

## Annotations vs metadata

- **Annotations:** Use for dimensions you want to filter or group on in the X-Ray console (eventId, classId, preconditionsOk, homeworkCount). Types: string, number, boolean.
- **Metadata:** Use for rich context that doesn't need to be indexed (payload sizes, HTTP status, collection names, branch outcomes, failure types). Stored under the segment's namespace.

## Where to instrument

- **Handler:** Parse/validate input and outbound SQS send as separate subsegments.
- **Orchestration:** One top-level process segment; subsegments for persistence and external calls.
- **Data layer:** Each Mongo operation (connect once per cold start, then getX/updateY) as its own subsegment.
- **HTTP clients:** Each outbound request (e.g. question service HEAD/POST) as a subsegment; add status, headers, and failure classification on error.
- **Failure boundaries:** Any place that can throw or return a business "fail" should be inside a traced block so errors and branch metadata show up on the segment.

## Stage segment names

### request-received

- `requestReceived.parseAndValidateEvent`
- `requestReceived.process`
- `requestReceived.persistTelemetry`
- `requestReceived.enqueueSelectHomework`
- `mongo.connect`
- `mongo.insertRequestReceived`

### select-homework

- `selectHomework.parseAndValidateEvent`
- `selectHomework.process`
- `selectHomework.preconditions`
- `selectHomework.persistPreconditionsTelemetry`
- `selectHomework.generateQuestionsSelection`
- `selectHomework.enqueueDedupCheck`
- `mongo.connect`
- `mongo.getSchoolClassQualification`
- `mongo.getActivePolicy`
- `mongo.updateTelemetryByEventId`
- `questionService.head`
- `questionService.generate`

## Testing

- **Mock:** `tests/mocks/aws.ts` is loaded via `tests/setup.ts`. It mocks `aws-xray-sdk-core` so that `captureAsyncFunc` is a Jest spy and the subsegment has `close`, `addAnnotation`, `addMetadata`, `addError`.
- **Asserting segment names:** In integration tests, require the mocked module, clear the spy before the handler run, then assert on `captureAsyncFunc.mock.calls.map(c => c[0])`. See `tests/select-homework/integration/select-homework.integration.test.ts` ("sends result to dedup-check queue") for the pattern.
- **Request-received:** Same instrumentation is used; segment-name assertions in that integration test are omitted due to mock/module resolution in the test environment. Expected segment names are listed above.

## Adding tracing to a new Lambda

1. Add `traceAsync` from `src/shared/trace` (or a thin wrapper that sets `namespace` for that stage).
2. Wrap parse/validate, process, persistence, and outbound SQS/HTTP in named subsegments.
3. Add annotations (eventId, classId, etc.) and metadata (sizes, status, branch) where useful.
4. Reuse `tests/mocks/aws.ts`; add segment-name assertions in integration tests if the mock is used in that test run.
