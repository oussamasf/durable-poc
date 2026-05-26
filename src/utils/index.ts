export function parseBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Message body is not valid JSON");
  }
}

export interface EmailRecipient {
  name?: string;
  email: string;
}

export interface ErrorAlertRecipients {
  recipients: EmailRecipient[];
  bcc: EmailRecipient[];
}

export function parseEmails(emailsStr: string | undefined): EmailRecipient[] {
  if (!emailsStr) {
    return [];
  }

  return emailsStr
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      const match = item.match(/^(.*?)\s*<(.*?)>$/);
      if (match) {
        return {
          name: match[1].trim() || undefined,
          email: match[2].trim(),
        };
      }
      return {
        email: item,
      };
    });
}

export function getErrorAlertRecipients(
  env: Record<string, string | undefined> = process.env,
): ErrorAlertRecipients {
  return {
    recipients: parseEmails(env.ERROR_ALERT_RECIPIENTS),
    bcc: parseEmails(env.ERROR_ALERT_BCC),
  };
}
