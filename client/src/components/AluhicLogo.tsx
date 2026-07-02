import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface AluhicLogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
}

function MedicalHeartIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimensions = {
    sm: { width: 28, height: 28, stroke: 2 },
    md: { width: 36, height: 36, stroke: 2 },
    lg: { width: 48, height: 48, stroke: 2.5 },
  };
  
  const { width, height, stroke } = dimensions[size];
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#E8833A" />
        </linearGradient>
      </defs>
      <circle 
        cx="24" 
        cy="24" 
        r="21" 
        stroke="url(#orangeGradient)" 
        strokeWidth={stroke} 
        fill="none"
      />
      <circle 
        cx="24" 
        cy="24" 
        r="16" 
        stroke="url(#orangeGradient)" 
        strokeWidth={stroke * 0.75} 
        fill="none"
      />
      <path 
        d="M24 14C21.5 14 19.5 16 19.5 18.5C19.5 21 21 22.5 24 26C27 22.5 28.5 21 28.5 18.5C28.5 16 26.5 14 24 14Z" 
        stroke="url(#orangeGradient)" 
        strokeWidth={stroke * 0.75} 
        fill="none"
        strokeLinejoin="round"
      />
      <path 
        d="M12 24H18L20 21L24 27L28 21L30 24H36" 
        stroke="url(#orangeGradient)" 
        strokeWidth={stroke} 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <path 
        d="M22 32V35M26 32V35M24 32V37" 
        stroke="url(#orangeGradient)" 
        strokeWidth={stroke * 0.6} 
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AluhicLogo({ 
  variant = "full", 
  size = "md",
  showSlogan = false,
  className,
  ...props
}: AluhicLogoProps) {
  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl"
  };

  const sloganSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm"
  };

  const LogoIcon = () => (
    <MedicalHeartIcon size={size} />
  );

  const Wordmark = () => (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span 
          className={cn("font-bold tracking-tight lowercase", textSizes[size])}
          style={{ 
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(135deg, #F5A623 0%, #E8833A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          aluh
        </span>
        <MedicalHeartIcon size={size} />
        <span 
          className={cn("font-bold tracking-tight lowercase", textSizes[size])}
          style={{ 
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(135deg, #F5A623 0%, #E8833A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          c
        </span>
      </div>
      {showSlogan && (
        <span 
          className={cn("text-center font-medium", sloganSizes[size])}
          style={{ 
            fontFamily: "Open Sans, sans-serif",
            background: "linear-gradient(135deg, #F5A623 0%, #E8833A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          data-testid="text-slogan"
        >
          Your Medical Partner
        </span>
      )}
    </div>
  );

  if (variant === "icon") {
    return (
      <div className={className} {...props}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={className} {...props}>
        <Wordmark />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)} data-testid="aluhic-logo" {...props}>
      <Wordmark />
    </div>
  );
}
