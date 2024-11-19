export function getIpAddress(xForwardedFor: string | string[]): string {
  if (!Array.isArray(xForwardedFor)) {
    return xForwardedFor;
  }

  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return xForwardedFor[0];
  }

  return '';
}
