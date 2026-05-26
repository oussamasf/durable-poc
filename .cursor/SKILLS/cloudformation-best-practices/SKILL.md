---
name: cloudformation-best-practices
description: Create and update AWS CloudFormation templates following environment-agnostic principles, pseudo-parameters, and standardized structure. Use when generating, reviewing, or modifying .yaml or .json CloudFormation templates.
---

# CloudFormation Best Practices

## Core Principles

- **Environment Agnostic**: Use `Parameters` and `Mappings` for environment-specific values (e.g., stage vs production).
- **Pseudo Parameters**: Use `${AWS::Partition}`, `${AWS::Region}`, and `${AWS::AccountId}` instead of hardcoded values in ARNs.
- **Time Zone**: Always use `Europe/London` if a time zone is required (e.g., in `AWS::Scheduler::Schedule`).
- **Visual Organization**: Use clear, consistent comment blocks to separate sections.

## Template Structure

Always follow this standardized layout for new templates:

```yaml
# ==============================================================================
# CLOUDFORMATION TEMPLATE: [Resource Name]
# ==============================================================================
# Description: [Brief description]
# ==============================================================================

AWSTemplateFormatVersion: "2010-09-09"
Description: "[Detailed description]"

# ------------------------------------------------------------------------------
# PARAMETERS
# ------------------------------------------------------------------------------
Parameters:
  Environment:
    Type: String
    Default: stage
    AllowedValues: [stage, production]
    Description: Environment name

# ------------------------------------------------------------------------------
# MAPPINGS
# ------------------------------------------------------------------------------
Mappings:
  EnvConfig:
    stage:
      # [Stage-specific values]
    production:
      # [Production-specific values]

# ------------------------------------------------------------------------------
# RESOURCES
# ------------------------------------------------------------------------------
Resources:
  [LogicalResourceId]:
    Type: "[AWS::Service::Resource]"
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      # Use !FindInMap [EnvConfig, !Ref Environment, KeyName]
      # Use !Sub "arn:${AWS::Partition}:..."

# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------
Outputs:
  [OutputName]:
    Description: [Description]
    Value: [Value]
```

## Common Fixes & Gotchas

1. **FlexibleTimeWindow**: For `AWS::Scheduler::Schedule`, this is REQUIRED. Use `Mode: 'OFF'` for exact timing.
2. **ARN Partition**: Never hardcode `arn:aws:`. Use `arn:${AWS::Partition}:`.
3. **Policies**: Always set `DeletionPolicy` and `UpdateReplacePolicy` to `Retain` for stateful resources unless explicitly asked otherwise.
