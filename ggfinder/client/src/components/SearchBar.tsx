import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export function SearchBar({ className = "", placeholder = "", onSearch = null, initialValue = "" }) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const navigate = useNavigate();
  const { currentTheme } = useThemeContext();
  const { t } = useLanguage();
  const { user } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className={`w-full ${className}`}>
      <div className={`relative w-full ${currentTheme.searchBarExterior} p-1 rounded-[30px]`}>
        <input
          type="text"
          className={`flex w-full ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-16 rounded-[25px] border border-gray-300 px-8 py-4 text-[#333333] ${currentTheme.searchBarInterior} focus-visible:ring-[#26A69A] text-lg`}
          placeholder={placeholder || t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-input"
          name="search-input"
          aria-label="Search"
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full ${currentTheme.buttonPrimary} p-4 hover:bg-opacity-90 transition-all`}
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-white"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    </form>
  );
}