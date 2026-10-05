import { queryOptions, useQuery } from "@tanstack/react-query";
import { env } from "@/config/env.ts";
import { NetworkError, apiClient } from "@/lib/api-client.ts";
import type { QueryConfig } from "@/lib/react-query.ts";

/** Resolves to `false` instead of throwing when the API is unreachable. */
export async function getHealth(signal?: AbortSignal): Promise<boolean> {
    try {
        const response = await apiClient.request("/health", { signal });
        return response.ok;
    } catch (error) {
        if (error instanceof NetworkError) return false;
        throw error;
    }
}

export function getHealthQueryOptions() {
    return queryOptions({
        queryKey: ["health"],
        queryFn: ({ signal }) => getHealth(signal),
        refetchInterval: env.HEALTH_POLL_INTERVAL_MS,
        staleTime: 0,
    });
}

export type HealthStatus = "checking" | "online" | "offline";

export function useApiHealth(config: QueryConfig<typeof getHealthQueryOptions> = {}): HealthStatus {
    const { data, isPending, isError } = useQuery({ ...getHealthQueryOptions(), ...config });

    if (isPending) return "checking";
    return data === true && !isError ? "online" : "offline";
}
