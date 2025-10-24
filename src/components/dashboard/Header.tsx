import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 border-b border-border shadow-sm backdrop-blur-md">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ClaimIQ Analytics
              </h1>
              <p className="text-muted-foreground text-xs lg:text-sm mt-1">
                Consensus-Driven Claims Intelligence Platform
              </p>
            </div>
          </div>
          
          <Link to="/extend-csv">
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Extend CSV</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
