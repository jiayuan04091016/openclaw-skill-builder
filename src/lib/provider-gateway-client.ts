function isBrowser() {
  return typeof window !== "undefined";
}

export function getClientGatewayUrl(path: string) {
  if (!isBrowser()) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}
