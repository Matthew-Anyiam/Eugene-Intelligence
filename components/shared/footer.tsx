import Link from "next/link";
import { Github, Twitter, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 px-4 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by the Eugene Intelligence team. Open source and powered by AI.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/eugene-intelligence"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link
            href="https://twitter.com/eugene_intelligence"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </Link>
          <Link
            href="https://eugene-intelligence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-5 w-5" />
            <span className="sr-only">Website</span>
          </Link>
        </div>
      </div>
      
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-4 px-4 md:flex-row">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:justify-start">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link href="/api" className="hover:text-foreground transition-colors">
              API
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2024 Eugene Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}