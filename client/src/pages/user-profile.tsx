import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import CarCard from "@/components/car/CarCard";
import { Loader2, User, Mail, Phone, LogOut, Edit, Car, Heart, MessageSquare, Plus } from "lucide-react";
import { Link } from "wouter";
import { Car as CarType, Favorite, Message } from "@shared/schema";

export default function UserProfile() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch user's cars
  const { data: userCars, isLoading: isLoadingCars } = useQuery<CarType[]>({
    queryKey: ["/api/user/cars"],
    enabled: !!user,
  });
  
  // Fetch user's favorites
  const { data: favorites, isLoading: isLoadingFavorites } = useQuery<Favorite[]>({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  });
  
  // Fetch cars for favorites
  const { data: allCars } = useQuery<CarType[]>({
    queryKey: ["/api/cars"],
    enabled: !!favorites && favorites.length > 0,
  });
  
  // Get favorite cars with data
  const favoriteCars = favorites?.map(favorite => {
    const car = allCars?.find(car => car.id === favorite.carId);
    return { favorite, car };
  }).filter(item => item.car) || [];
  
  // Fetch user's messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/user/messages"],
    enabled: !!user,
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  if (!user) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <main className="bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-gray-600">Manage your profile, listings, and messages</p>
          </div>
          
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              <TabsTrigger value="profile" className="flex gap-2">
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="listings" className="flex gap-2">
                <Car className="h-4 w-4" /> My Listings
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex gap-2">
                <Heart className="h-4 w-4" /> Saved Cars
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex gap-2">
                <MessageSquare className="h-4 w-4" /> Messages
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                  <CardContent className="pt-6 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarFallback className="text-xl bg-primary text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">Member since {new Date().toLocaleDateString()}</p>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mb-4 w-full" 
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {logoutMutation.isPending ? "Logging out..." : "Sign Out"}
                    </Button>
                    
                    <div className="w-full">
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Listings</span>
                          <span className="font-medium">{userCars?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Saved Cars</span>
                          <span className="font-medium">{favorites?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Messages</span>
                          <span className="font-medium">{messages?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>View and update your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Full Name</label>
                        <div className="flex items-center">
                          <Input value={user.name} disabled className="bg-gray-50" />
                          <Button variant="ghost" size="icon" className="ml-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Username</label>
                        <Input value={user.username} disabled className="bg-gray-50" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <div className="flex items-center">
                          <Input value={user.email} disabled className="bg-gray-50" />
                          <Button variant="ghost" size="icon" className="ml-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Phone</label>
                        <div className="flex items-center">
                          <Input value={user.phone || "Not provided"} disabled className="bg-gray-50" />
                          <Button variant="ghost" size="icon" className="ml-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Account Security</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Password</label>
                          <div className="flex">
                            <Input type="password" value="••••••••" disabled className="bg-gray-50" />
                            <Button variant="outline" className="ml-2">Change</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Listings Tab */}
            <TabsContent value="listings">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Car Listings</h2>
                <Link href="/sell">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Listing
                  </Button>
                </Link>
              </div>
              
              {isLoadingCars ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userCars && userCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCars.map((car) => (
                    <CarCard 
                      key={car.id} 
                      car={car} 
                    />
                  ))}
                </div>
              ) : (
                <Card className="py-8">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 p-3 rounded-full mb-4">
                      <Car className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Listings Yet</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      You haven't created any car listings yet. Create your first listing to start selling!
                    </p>
                    <Link href="/sell">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Listing
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Saved Cars</h2>
                <Link href="/browse">
                  <Button variant="outline">
                    Browse More Cars
                  </Button>
                </Link>
              </div>
              
              {isLoadingFavorites ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : favoriteCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteCars.map(({ favorite, car }) => (
                    car && (
                      <CarCard 
                        key={car.id} 
                        car={car} 
                        favorite={favorite}
                      />
                    )
                  ))}
                </div>
              ) : (
                <Card className="py-8">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 p-3 rounded-full mb-4">
                      <Heart className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Saved Cars</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      You haven't saved any cars yet. Browse listings and click the heart icon to save cars you're interested in.
                    </p>
                    <Link href="/browse">
                      <Button>
                        Browse Cars
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Messages Tab */}
            <TabsContent value="messages">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Messages</h2>
              </div>
              
              {isLoadingMessages ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <Card key={message.id} className={`${!message.isRead ? 'border-primary border-l-4' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="mt-1">
                              <AvatarFallback className="bg-gray-200 text-gray-700">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center mb-1">
                                <p className="font-medium">{message.fromUserId === user.id ? 'You' : 'User ' + message.fromUserId}</p>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {message.fromUserId === user.id ? 'Sent' : 'Received'}
                                </Badge>
                                {!message.isRead && message.toUserId === user.id && (
                                  <Badge className="ml-2 text-xs">New</Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mt-1 mb-2">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                              <p className="text-gray-800">{message.content}</p>
                            </div>
                          </div>
                          <Link href={`/cars/${message.carId}`}>
                            <Button variant="outline" size="sm">
                              View Car
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="py-8">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 p-3 rounded-full mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Messages</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      You don't have any messages yet. Messages from buyers and sellers will appear here.
                    </p>
                    <Link href="/browse">
                      <Button>
                        Browse Cars
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
