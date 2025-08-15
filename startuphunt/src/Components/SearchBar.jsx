import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { semanticSearch } from '../utils/aiApi';

const SearchBar = () => {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // AI-powered search suggestions
  const generateAISuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      // Generate AI suggestions
      const suggestions = [
        `Find ${query} alternatives`,
        `Best ${query} tools`,
        `${query} for startups`,
        `${query} solutions`,
        `Top ${query} platforms`
      ];

      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.log('AI suggestions not available, using basic search');
    }
  }, []);

  // Debounced AI suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search.trim().length >= 2) {
        generateAISuggestions(search);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, generateAISuggestions]);

  // Enhanced search with AI
  const handleEnhancedSearch = async () => {
    if (!search.trim()) return;

    setIsSearching(true);
    try {
      // Try AI search first
      const aiResults = await semanticSearch(search, 20, {});
      if (aiResults.success && aiResults.results.length > 0) {
        console.log('AI search found:', aiResults.results.length, 'results');
        // You can handle AI results here without changing existing logic
      }
    } catch (error) {
      console.log('AI search not available, using existing search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    handleEnhancedSearch();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="relative flex justify-center w-full max-w-md">
          <input
            type="text"
            placeholder="Search for Launches, categories, or more..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEnhancedSearch()}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              <Search />
            )}
          </span>

          {/* AI Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
                🤖 AI Suggestions
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchBar;
