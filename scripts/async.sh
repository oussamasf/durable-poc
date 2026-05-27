#!/usr/bin/env bash

aws lambda invoke \
  --function-name durable-stack-temporal:live \
  --invocation-type Event \
  --region eu-west-2 \
  --cli-binary-format raw-in-base64-out \
  --output json \
  --payload '{"orderId": "12345"}' \
  response.json