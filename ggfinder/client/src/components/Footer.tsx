import { Link } from "react-router-dom"
import { useThemeContext } from "@/contexts/ThemeContext"

export function Footer() {
  const { currentTheme } = useThemeContext();

  // Get the correct background color for the footer based on theme
  let footerBgClass = currentTheme.headerFooterBg || "";

  return (
    <footer className={`py-6 mt-auto w-full ${footerBgClass}`}>
      <div className="container mx-auto px-4 sm:px-6 max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              © 2023 ggFINDER. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className={`text-sm ${currentTheme.textSecondary} hover:underline`}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={`text-sm ${currentTheme.textSecondary} hover:underline`}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}