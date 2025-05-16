import { useThemeContext } from "@/contexts/ThemeContext";
import { useTheme } from "@/components/ui/theme-provider";
import { useMobile } from "@/hooks/useMobile";

interface LogoProps {
  className?: string;
  isHeader?: boolean;
}

export function Logo({ className = "", isHeader = false }: LogoProps) {
  const { currentTheme } = useThemeContext();
  const { theme } = useTheme();
  const isMobile = useMobile();

  // Determine text color based on theme - ensure white text for dark themes
  const textColorClass = theme === "dark" || currentTheme.value === "green-forest"
    ? "text-white"
    : currentTheme.textPrimary;

  // Logo size based on screen size and whether it's in the header
  const logoSize = isHeader
    ? isMobile ? "text-[64px]" : "text-[92px]" // Much larger for homepage header
    : isMobile ? "text-[28px]" : "text-[36px]"; // Slightly larger for other places

  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <div className="relative inline-flex items-center">
        <span className={`${logoSize} font-bold bg-gradient-to-r ${currentTheme.primaryColor} bg-clip-text text-transparent`}>
          ggFinder
        </span>
        {isHeader && (
          <div className="absolute" style={{
            top: isHeader ? (isMobile ? '-5px' : '-5px') : '-5px', // Lowered the ALPHA position
            right: isHeader ? (isMobile ? '0px' : '10px') : '0px',
            transform: 'translateX(100%)'
          }}>
            <span className="text-[#FF7043] font-bold text-[16px]">ALPHA</span>
          </div>
        )}
      </div>
    </div>
  );
}