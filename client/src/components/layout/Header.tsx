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
import { useToast } from "@/hooks/use-toast";

// Logo URLs
const logo = "/carmarkt.png";
const logoSmall = "/carmarkt.png";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

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
  
  const showComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon",
      description: `${feature} feature will be available soon. Stay tuned!`,
      duration: 3000,
    });
  };

  type NavLink = {
    text: string;
    href?: string;
    isComingSoon?: boolean;
  };

  const navLinks: NavLink[] = [
    { text: "Browse Cars", href: "/browse" },
    { text: "How It Works", href: "/how-it-works" },
    { text: "Pricing", isComingSoon: true },
    { text: "Dealers", isComingSoon: true },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => window.location.href = "/"}
          >
            <img 
              src={logo} 
              alt="CarMarkt.com.cy" 
              className="h-10 hidden md:block" 
            />
            <img 
              src={logoSmall} 
              alt="CarMarkt.com.cy" 
              className="h-10 md:hidden" 
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navLinks.map((link, index) => (
              <div 
                key={index}
                onClick={() => {
                  if (link.isComingSoon) {
                    showComingSoon(link.text);
                  } else {
                    window.location.href = link.href!;
                  }
                }}
                className="text-gray-600 hover:text-primary transition text-sm lg:text-base whitespace-nowrap cursor-pointer"
              >
                {link.text}
              </div>
            ))}
          </div>

          {/* Auth & Sell Button */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button 
              variant="default"
              className="hidden md:block text-sm lg:text-base"
              onClick={() => window.location.href = "/sell"}
            >
              Sell Your Car
            </Button>

            {user ? (
              <>
                {/* Messages icon with notification badge */}
                <div className="hidden md:block relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative" 
                    aria-label="Messages"
                    onClick={() => window.location.href = "/profile?tab=messages"}
                  >
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </Badge>
                    )}
                  </Button>
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
                      <DropdownMenuItem onClick={() => window.location.href = "/profile"}>
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/profile?tab=listings"}>
                        My Listings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/profile?tab=favorites"}>
                        Saved Cars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/profile?tab=messages"}>
                        <div className="flex w-full justify-between items-center">
                          Messages
                          {unreadMessages > 0 && (
                            <Badge className="ml-2">{unreadMessages}</Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
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
                <Button 
                  variant="ghost" 
                  className="text-sm lg:text-base"
                  onClick={() => window.location.href = "/auth"}
                >
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
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
                  <SheetTitle className="flex justify-center">
                    <img src="/carmarkt.png" alt="CarMarkt.com.cy" className="h-10" />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-4">
                  {navLinks.map((link, index) => (
                    <div 
                      key={index}
                      onClick={() => {
                        if (link.isComingSoon) {
                          showComingSoon(link.text);
                          setMobileMenuOpen(false);
                        } else if (link.href) {
                          window.location.href = link.href;
                          setMobileMenuOpen(false);
                        }
                      }}
                      className="text-gray-600 hover:text-primary transition py-2 cursor-pointer"
                    >
                      {link.text}
                    </div>
                  ))}
                  
                  {user ? (
                    <>
                      <div 
                        onClick={() => {
                          window.location.href = "/profile";
                          setMobileMenuOpen(false);
                        }}
                        className="text-gray-600 hover:text-primary transition py-2 cursor-pointer"
                      >
                        My Profile
                      </div>
                      <div 
                        onClick={() => {
                          window.location.href = "/profile?tab=listings";
                          setMobileMenuOpen(false);
                        }}
                        className="text-gray-600 hover:text-primary transition py-2 cursor-pointer"
                      >
                        My Listings
                      </div>
                      <div 
                        onClick={() => {
                          window.location.href = "/profile?tab=favorites";
                          setMobileMenuOpen(false);
                        }}
                        className="text-gray-600 hover:text-primary transition py-2 cursor-pointer"
                      >
                        Saved Cars
                      </div>
                      <div 
                        onClick={() => {
                          window.location.href = "/profile?tab=messages";
                          setMobileMenuOpen(false);
                        }}
                        className="text-gray-600 hover:text-primary transition py-2 flex items-center justify-between cursor-pointer"
                      >
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
                    <div 
                      onClick={() => {
                        window.location.href = "/auth";
                        setMobileMenuOpen(false);
                      }}
                      className="text-gray-600 hover:text-primary transition py-2 cursor-pointer"
                    >
                      Login / Register
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-2"
                    onClick={() => {
                      window.location.href = "/sell";
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sell Your Car
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
