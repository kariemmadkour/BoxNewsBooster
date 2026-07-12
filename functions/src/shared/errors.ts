export class ConnectorError extends Error {
  constructor(
    public connectorId: string,
    message: string,
    public cause?: unknown
  ) {
    super(message);
  }
}

export class RateLimitError extends ConnectorError {
  constructor(connectorId: string, message: string, public retryAfterMs?: number) {
    super(connectorId, message);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
