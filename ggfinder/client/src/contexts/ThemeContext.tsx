import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ThemeOption } from "@/types";

export const themeOptions: ThemeOption[] = [
  {
    name: "Light",
    value: "light",
    primaryColor: "from-[#26A69A] to-[#26A69A]",
    secondaryColor: "bg-white",
    searchBarExterior: "bg-[#E0E0E0]",
    searchBarInterior: "bg-white",
    buttonPrimary: "bg-[#26A69A] hover:bg-[#1E8A7E] text-white",
    buttonSecondary: "bg-[#555555] hover:bg-[#444444] text-white",
    textPrimary: "text-[#333333]",
    textSecondary: "text-[#555555]",
    headerFooterBg: "bg-white",
    cardBg: "bg-white"
  },
  {
    name: "Dark",
    value: "dark",
    primaryColor: "from-[#26A69A] to-[#26A69A]",
    secondaryColor: "bg-[#1A1A1A]",
    searchBarExterior: "bg-[#333333]",
    searchBarInterior: "bg-[#2A2A2A]",
    buttonPrimary: "bg-[#26A69A] hover:bg-[#1E8A7E] text-white",
    buttonSecondary: "bg-[#555555] hover:bg-[#444444] text-white",
    textPrimary: "text-white",
    textSecondary: "text-gray-300",
    headerFooterBg: "bg-[#1A1A1A]",
    cardBg: "bg-[#2A2A2A]"
  },
  {
    name: "Green Forest",
    value: "green-forest",
    primaryColor: "from-[#1A5D20] to-[#1A5D20]",
    secondaryColor: "bg-[#E8F5E9]",
    searchBarExterior: "bg-[#C8E6C9]",
    searchBarInterior: "bg-white",
    buttonPrimary: "bg-[#2E7D32] hover:bg-[#1A5D20] text-white",
    buttonSecondary: "bg-[#81C784] hover:bg-[#66BB6A] text-white",
    textPrimary: "text-[#1A5D20]",
    textSecondary: "text-[#33691E]",
    headerFooterBg: "bg-[#2E7D32]",
    cardBg: "bg-[#E8F5E9]"
  },
  {
    name: "Cool",
    value: "cool",
    primaryColor: "from-[#26A69A] to-[#26A69A]",
    secondaryColor: "bg-[#ECEFF1]",
    searchBarExterior: "bg-[#CFD8DC]",
    searchBarInterior: "bg-white",
    buttonPrimary: "bg-[#26A69A] hover:bg-[#1E8A7E] text-white",
    buttonSecondary: "bg-[#546E7A] hover:bg-[#455A64] text-white",
    textPrimary: "text-[#263238]",
    textSecondary: "text-[#455A64]",
    headerFooterBg: "bg-[#ECEFF1]",
    cardBg: "bg-white"
  }
];

interface ThemeContextType {
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(themeOptions[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme-option');
    if (savedTheme) {
      const theme = themeOptions.find(t => t.value === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  const setTheme = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    localStorage.setItem('app-theme-option', theme.value);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};