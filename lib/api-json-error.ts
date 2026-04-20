const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

/**
 * Normalizes error text from typical BFF JSON bodies ({ message }, { error }, nested data, errors[]).
 */
export function readApiJsonMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }
  if (nonEmptyString(payload.message)) {
    return payload.message;
  }
  if (nonEmptyString(payload.error)) {
    return payload.error;
  }
  const data = payload.data;
  if (isRecord(data)) {
    if (nonEmptyString(data.message)) {
      return data.message;
    }
    if (nonEmptyString(data.error)) {
      return data.error;
    }
  }
  const errors = payload.errors;
  if (Array.isArray(errors) && errors.length > 0 && nonEmptyString(errors[0])) {
    return errors[0];
  }
  return fallback;
}
