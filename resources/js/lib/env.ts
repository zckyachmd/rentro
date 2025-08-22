export function getAppName(defaultName = 'Rentro'): string {
    try {
        const env = (
            import.meta as unknown as { env?: { VITE_APP_NAME?: string } }
        ).env;
        return env?.VITE_APP_NAME ?? defaultName;
    } catch {
        return defaultName;
    }
}
