/**
 * Utility functions for the EmoLit application
 */

/**
 * Creates a URL path for a given page name
 * @param {string} pageName - The name of the page (e.g., "Home", "Quiz", "Journal", "Progress")
 * @returns {string} The URL path for the page
 */
export function createPageUrl(pageName) {
  const pageMap = {
    Home: "/",
    Quiz: "/quiz",
    Journal: "/journal",
    Progress: "/progress",
    Profile: "/profile"
  };
  
  return pageMap[pageName] || "/";
}

