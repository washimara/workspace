import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { useThemeContext } from "@/contexts/ThemeContext"

export function Layout() {
  const { currentTheme } = useThemeContext();
  
  // Apply a theme-specific class to the entire layout
  let themeClass = "light-theme";
  if (currentTheme.value === "dark") themeClass = "dark-theme";
  else if (currentTheme.value === "green-forest") themeClass = "green-forest-theme";
  else if (currentTheme.value === "cool") themeClass = "cool-theme";

  return (
    <div className={`min-h-screen flex flex-col w-full ${themeClass}`}>
      <Header />
      <div className="pt-16 flex-grow w-full">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}