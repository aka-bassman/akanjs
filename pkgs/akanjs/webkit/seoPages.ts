export const createRobotPage = (
  clientHttpUri: string,
  config?: { rules: { userAgent: string; allow: string; disallow: string }; sitemap: string },
): { rules: { userAgent: string; allow: string; disallow: string }; sitemap: string } => {
  return {
    ...(config ?? {}),
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
      ...(config?.rules ?? {}),
    },
    sitemap: `${clientHttpUri}/sitemap.xml`,
  };
};

const lastModified = new Date();
export const createSitemapPage = (clientHttpUri: string, paths: string[]): { url: string; lastModified: Date }[] => {
  return paths.map((path) => ({ url: `${clientHttpUri}${path}`, lastModified }));
};
