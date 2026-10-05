import { QueryClient } from "@tanstack/react-query";
import type { DefaultOptions, UseMutationOptions } from "@tanstack/react-query";

export const queryConfig = {
    queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 60 * 1000,
    },
    mutations: {
        retry: false,
    },
} satisfies DefaultOptions;

export function createQueryClient(): QueryClient {
    return new QueryClient({ defaultOptions: queryConfig });
}

type ApiFnReturnType<FnType extends (...args: never[]) => Promise<unknown>> = Awaited<ReturnType<FnType>>;

/** Options a caller may override for a feature query hook (queryKey/queryFn are owned by the feature). */
export type QueryConfig<T extends (...args: never[]) => object> = Partial<Omit<ReturnType<T>, "queryKey" | "queryFn">>;

/** Options a caller may override for a feature mutation hook (mutationFn is owned by the feature). */
export type MutationConfig<MutationFnType extends (...args: never[]) => Promise<unknown>> = UseMutationOptions<
    ApiFnReturnType<MutationFnType>,
    Error,
    Parameters<MutationFnType>[0]
>;
