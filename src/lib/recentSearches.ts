export interface RecentSearch {
  id: string;
  query: string;
  userEmail: string;
  searchedAt: string;
}

const RECENT_SEARCHES_KEY = 'lucida_recent_user_searches';
const MAX_RECENT_SEARCHES = 10;

export class RecentSearchManager {
  static getRecentSearches(): RecentSearch[] {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return [];
      
      const searches: RecentSearch[] = JSON.parse(stored);
      // Sort by most recent first
      return searches.sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime());
    } catch (error) {
      console.error('Error loading recent searches:', error);
      return [];
    }
  }

  static addRecentSearch(query: string, userEmail: string): void {
    try {
      const searches = this.getRecentSearches();
      
      // Remove existing search for the same query to avoid duplicates
      const filteredSearches = searches.filter(search => 
        search.query.toLowerCase() !== query.toLowerCase()
      );
      
      const newSearch: RecentSearch = {
        id: Math.random().toString(36).substr(2, 9),
        query: query.trim(),
        userEmail,
        searchedAt: new Date().toISOString()
      };
      
      // Add new search at the beginning and limit to MAX_RECENT_SEARCHES
      const updatedSearches = [newSearch, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
      
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  static removeRecentSearch(searchId: string): void {
    try {
      const searches = this.getRecentSearches();
      const updatedSearches = searches.filter(search => search.id !== searchId);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  }

  static clearRecentSearches(): void {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }
} 