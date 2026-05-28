#!/usr/bin/env bash
set -euo pipefail

FUNCTION_NAME="durable-stack-temporal:live"
REGION="eu-west-2"

for i in $(seq 1 10); do
  aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --invocation-type Event \
    --region "$REGION" \
    --cli-binary-format raw-in-base64-out \
    --output json \
    --payload "{\"orderId\": \"order-$i\"}" \
    "response-$i.json" &
done

wait
echo "Submitted 10 async invocations to $FUNCTION_NAME"
