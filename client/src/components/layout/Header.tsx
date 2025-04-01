import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
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
import { Badge } from "@/components/ui/badge";
import { Car, User, ChevronDown, Menu, MessageSquare } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread messages count
  const { data: unreadMessages = 0 } = useQuery<number>({
    queryKey: ["/api/user/messages/unread/count"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinks = [
    { text: "Browse Cars", href: "/browse" },
    { text: "How It Works", href: "/how-it-works" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <span className="text-primary text-xl md:text-2xl font-bold">CarTrader</span>
              <Car className="h-5 w-5 text-primary" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navLinks.map((link, index) => (
              <Link 
                key={index} 
                href={link.href}
              >
                <div className="text-gray-600 hover:text-primary transition text-sm lg:text-base whitespace-nowrap cursor-pointer">
                  {link.text}
                </div>
              </Link>
            ))}
          </div>

          {/* Auth & Sell Button */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link href="/sell">
              <Button 
                variant="default" 
                className="hidden md:block text-sm lg:text-base"
              >
                Sell Your Car
              </Button>
            </Link>

            {user ? (
              <>
                {/* Messages icon with notification badge */}
                <div className="hidden md:block relative">
                  <Link href="/profile?tab=messages">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative" 
                    aria-label="Messages"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </Link>
                </div>

                {/* User dropdown */}
                <div className="relative hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 text-sm lg:text-base">
                        <User className="h-4 w-4 mr-1" />
                        <span className="max-w-[100px] lg:max-w-none truncate">{user.name}</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <Link href="/profile">
                        <DropdownMenuItem>
                          My Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/profile?tab=listings">
                        <DropdownMenuItem>
                          My Listings
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/profile?tab=favorites">
                        <DropdownMenuItem>
                          Saved Cars
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/profile?tab=messages">
                        <DropdownMenuItem>
                          <div className="flex w-full justify-between items-center">
                            Messages
                            {unreadMessages > 0 && (
                              <Badge className="ml-2">{unreadMessages}</Badge>
                            )}
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="hidden md:block">
                <Link href="/auth">
                  <Button 
                    variant="ghost" 
                    className="text-sm lg:text-base"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </Link>
              </div>
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
                    <Link 
                      key={index}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="text-gray-600 hover:text-primary transition py-2 cursor-pointer">
                        {link.text}
                      </div>
                    </Link>
                  ))}
                  
                  {user ? (
                    <>
                      <Link 
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="text-gray-600 hover:text-primary transition py-2 cursor-pointer">
                          My Profile
                        </div>
                      </Link>
                      <Link 
                        href="/profile?tab=listings"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="text-gray-600 hover:text-primary transition py-2 cursor-pointer">
                          My Listings
                        </div>
                      </Link>
                      <Link 
                        href="/profile?tab=favorites"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="text-gray-600 hover:text-primary transition py-2 cursor-pointer">
                          Saved Cars
                        </div>
                      </Link>
                      <Link 
                        href="/profile?tab=messages"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="text-gray-600 hover:text-primary transition py-2 flex items-center justify-between cursor-pointer">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                          </div>
                          {unreadMessages > 0 && (
                            <Badge className="ml-2">
                              {unreadMessages > 9 ? '9+' : unreadMessages}
                            </Badge>
                          )}
                        </div>
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
                    <Link 
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="text-gray-600 hover:text-primary transition py-2 cursor-pointer">
                        Login / Register
                      </div>
                    </Link>
                  )}
                  
                  <Link href="/sell" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full mt-2">
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
