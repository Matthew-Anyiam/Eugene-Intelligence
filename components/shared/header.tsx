"use client";

import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Search className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Eugene Intelligence
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/search"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Search
            </Link>
            <Link
              href="/academic"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Academic
            </Link>
            <Link
              href="/code"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Code
            </Link>
            <Link
              href="/weather"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Weather
            </Link>
          </nav>
        </div>
        
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <Search className="h-6 w-6 text-primary" />
              <span className="font-bold">Eugene Intelligence</span>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">
              Get Started
            </Button>
          </nav>
        </div>
        
        {isMenuOpen && (
          <div className="absolute top-14 left-0 w-full bg-background border-b md:hidden">
            <nav className="flex flex-col space-y-2 p-4">
              <Link
                href="/search"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/academic"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Academic
              </Link>
              <Link
                href="/code"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Code
              </Link>
              <Link
                href="/weather"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Weather
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}