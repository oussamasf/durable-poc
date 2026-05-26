#!/usr/bin/env bash
set -e

STACK_NAME="${STACK_NAME:-log-stream-processor}"

echo "Deleting stack: $STACK_NAME"
aws cloudformation delete-stack --stack-name "$STACK_NAME"

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo "Building SAM application..."
sam build

echo "Deploying..."
sam deploy
