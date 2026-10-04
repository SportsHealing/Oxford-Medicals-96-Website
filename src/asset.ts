// Prefix a public-folder path with the build's base URL so it works in sub-path previews.
export const asset = (path: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + path
