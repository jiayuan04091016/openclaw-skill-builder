function readValue(value: string | undefined) {
  return value?.trim() || "";
}

export type ProviderConfig = {
  authProviderUrl: string;
  cloudStorageProviderUrl: string;
};

export function getProviderConfig(): ProviderConfig {
  return {
    authProviderUrl: readValue(process.env.NEXT_PUBLIC_AUTH_PROVIDER_URL),
    cloudStorageProviderUrl: readValue(process.env.NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL),
  };
}
