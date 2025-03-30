import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Car, User, ChevronDown, Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinks = [
    { text: "Browse Cars", href: "/browse" },
    { text: "How It Works", href: "/#how-it-works" },
    { text: "Reviews", href: "/#testimonials" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2">
              <span className="text-primary text-2xl font-bold">CarTrader</span>
              <Car className="h-5 w-5 text-primary" />
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <a className="text-gray-600 hover:text-primary transition">
                  {link.text}
                </a>
              </Link>
            ))}
          </div>

          {/* Auth & Sell Button */}
          <div className="flex items-center space-x-4">
            <Link href="/sell">
              <Button variant="default" className="hidden md:block">
                Sell Your Car
              </Button>
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1">
                      <User className="h-4 w-4 mr-1" />
                      <span>{user.name}</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">My Listings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Saved Cars</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Messages</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth" className="hidden md:block">
                <Button variant="ghost">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>CarTrader</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-4">
                  {navLinks.map((link, index) => (
                    <Link key={index} href={link.href}>
                      <a 
                        className="text-gray-600 hover:text-primary transition py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.text}
                      </a>
                    </Link>
                  ))}
                  
                  {user ? (
                    <>
                      <Link href="/profile">
                        <a 
                          className="text-gray-600 hover:text-primary transition py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Profile
                        </a>
                      </Link>
                      <Link href="/profile">
                        <a 
                          className="text-gray-600 hover:text-primary transition py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Listings
                        </a>
                      </Link>
                      <Link href="/profile">
                        <a 
                          className="text-gray-600 hover:text-primary transition py-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Saved Cars
                        </a>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="justify-start px-0"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth">
                      <a 
                        className="text-gray-600 hover:text-primary transition py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login / Register
                      </a>
                    </Link>
                  )}
                  
                  <Link href="/sell">
                    <Button 
                      className="w-full mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sell Your Car
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
