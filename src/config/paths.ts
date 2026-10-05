/** Central registry of application routes; use these instead of string literals. */
export const paths = {
    home: {
        path: "/",
        getHref: () => "/",
    },
} as const;
