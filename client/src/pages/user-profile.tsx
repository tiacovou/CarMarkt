import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CarCard from "@/components/car/CarCard";
import UserCarCard from "@/components/car/UserCarCard";
import { Loader2, User as UserIcon, Mail, Phone as PhoneIcon, LogOut, Edit, Car, Heart, MessageSquare, Plus, CreditCard, Lock, Check, X } from "lucide-react";
import { Link } from "wouter";
import { Car as CarType, Favorite, Message, Payment, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Password change form schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function UserProfile() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'name' | 'email' | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [replyingTo, setReplyingTo] = useState<{messageId: number, toUserId: number, carId: number} | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // State to track admin status
  const { toast } = useToast();
  
  // Fetch user's cars
  const { data: userCars, isLoading: isLoadingCars } = useQuery<CarType[]>({
    queryKey: ["/api/user/cars"],
    enabled: !!user,
  });
  
  // Fetch premium info and payments
  const { data: premiumInfo, isLoading: isLoadingPremium } = useQuery<{
    isPremium: boolean;
    freeListingsUsed: number;
    freeListingsRemaining: number;
    activeListings: number;
    requiresPayment: boolean;
  }>({
    queryKey: ["/api/user/premium-info"],
    enabled: !!user,
  });
  
  // Fetch user's payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/user/payments"],
    enabled: !!user,
  });
  
  // Upgrade to premium
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/upgrade", {
        amount: 5.00,
        description: "Premium subscription - monthly"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Upgrade successful!",
        description: "You now have premium access with unlimited listings.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { toUserId: number; carId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      // Reset the reply form
      setReplyMessage("");
      setReplyingTo(null);
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ["/api/user/messages"] });
      
      toast({
        title: "Message sent",
        description: "Your reply has been sent successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ["/api/user/messages"] });
    },
    onError: (error: Error) => {
      console.error("Failed to mark message as read:", error);
    }
  });
  
  // Handle sending a reply
  const handleSendReply = () => {
    if (!replyingTo || !replyMessage.trim()) return;
    
    sendMessageMutation.mutate({
      toUserId: replyingTo.toUserId,
      carId: replyingTo.carId,
      content: replyMessage
    });
  };
  
  // Setup password change form
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });
  
  // Avatar upload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error uploading avatar');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
        variant: "default",
      });
      
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        avatarUrl: data.avatarUrl
      }));
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeFormValues) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated",
        variant: "default",
      });
      
      setIsPasswordModalOpen(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "The image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Upload the avatar
    avatarUploadMutation.mutate(file);
  };

  const handlePasswordSubmit = (data: PasswordChangeFormValues) => {
    changePasswordMutation.mutate(data);
  };
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string }) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });
      
      // Update the user data in the cache
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        ...data.user
      }));
      
      // Check if phone number was changed
      const currentUser = queryClient.getQueryData<User>(["/api/user"]);
      if (variables.phone && currentUser && variables.phone !== currentUser.phone) {
        // Invalidate the verification status
        queryClient.invalidateQueries({queryKey: ["/api/user/verify-phone/status"]});
        
        // Show toast notification about phone number update
        toast({
          title: "Phone number updated",
          description: "Your phone number has been updated successfully",
          variant: "default",
        });
      }
      
      // Reset edit mode
      setEditMode(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Start editing a field
  const startEdit = (field: 'name' | 'email') => {
    if (!user) return;
    
    // Initialize the field with current value
    if (field === 'name') {
      setEditedName(user.name);
    } else if (field === 'email') {
      setEditedEmail(user.email);
    }
    
    setEditMode(field);
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditMode(null);
  };
  
  // Save changes
  const handleSaveChanges = () => {
    if (!user) return;
    
    const data: any = {};
    
    // Always include name as it's required by the backend
    data.name = editMode === 'name' ? editedName : user.name;
    
    // Add email if we're editing the email field
    if (editMode === 'email') {
      data.email = editedEmail;
    }
    
    updateProfileMutation.mutate(data);
  };
  
  // Check if user is admin
  useEffect(() => {
    if (user) {
      // For demo purposes, we'll consider the user with ID 1 as the admin
      // In a real app, this would be determined by a role on the user record
      setIsAdmin(user.id === 1);
    }
  }, [user]);

  // Cleanup expired listings mutation
  const cleanupExpiredMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cleanup-expired-listings", {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cleanup Successful",
        description: "Expired car listings have been cleaned up",
        variant: "default",
      });
      
      // Refresh cars after cleanup
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/cars"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCleanupExpired = () => {
    cleanupExpiredMutation.mutate();
  };

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
                <UserIcon className="h-4 w-4" /> Profile
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
              {/* Payment tab hidden for now
              <TabsTrigger value="payments" className="flex gap-2">
                <CreditCard className="h-4 w-4" /> Payments
              </TabsTrigger>
              */}
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                  <CardContent className="pt-6 flex flex-col items-center">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 mb-4">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="text-xl bg-primary text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="absolute bottom-3 right-0 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <input 
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    
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
                      
                      {/* Admin Section */}
                      {isAdmin && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-4">
                            <div className="text-sm font-semibold">Admin Tools</div>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="w-full"
                              onClick={handleCleanupExpired}
                              disabled={cleanupExpiredMutation.isPending}
                            >
                              {cleanupExpiredMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cleaning...
                                </>
                              ) : (
                                <>Clean Expired Listings</>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
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
                          <Input 
                            value={editMode === 'name' ? editedName : user.name} 
                            disabled={editMode !== 'name'} 
                            className={editMode !== 'name' ? "bg-gray-50" : ""} 
                            onChange={(e) => setEditedName(e.target.value)}
                          />
                          {editMode === 'name' ? (
                            <div className="flex gap-2 ml-2">
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={handleSaveChanges}
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" className="ml-2" onClick={() => startEdit('name')}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Username</label>
                        <Input value={user.username} disabled className="bg-gray-50" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <div className="flex items-center">
                          <Input 
                            value={editMode === 'email' ? editedEmail : user.email} 
                            disabled={editMode !== 'email'} 
                            className={editMode !== 'email' ? "bg-gray-50" : ""} 
                            onChange={(e) => setEditedEmail(e.target.value)}
                            type="email"
                          />
                          {editMode === 'email' ? (
                            <div className="flex gap-2 ml-2">
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={handleSaveChanges}
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" className="ml-2" onClick={() => startEdit('email')}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Phone</label>
                        <div className="flex items-center">
                          <Input 
                            value={user.phone || "Not provided"} 
                            disabled
                            className="bg-gray-50"
                            placeholder="+35712345678"
                          />
                          <div className="ml-2 bg-gray-100 px-2 py-1 rounded text-gray-500 text-xs">
                            Locked
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                        <p className="text-sm text-gray-700">
                          {user.freeListingsUsed === 0 ? (
                            "You have 1 free car listing available this month."
                          ) : (
                            "You have used your free listing for this month. Additional listings cost €1 each."
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Account Security</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Password</label>
                          <div className="flex">
                            <Input type="password" value="••••••••" disabled className="bg-gray-50" />
                            <Button 
                              variant="outline" 
                              className="ml-2"
                              onClick={() => setIsPasswordModalOpen(true)}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Change
                            </Button>
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
                <div className="flex gap-2">
                  {user && premiumInfo?.activeListings !== undefined && (
                    premiumInfo.freeListingsRemaining > 0 || user.isPremium ? (
                      <Link href="/sell">
                        <Button className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create Listing
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/checkout">
                        <Button className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Pay for Listing (€1)
                        </Button>
                      </Link>
                    )
                  )}
                  
                  {user && !user.isPremium && (
                    <Link href="/subscribe">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Go Premium
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
              {isLoadingCars ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userCars && userCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCars.map((car) => (
                    <UserCarCard 
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
                      You don't have any car listings yet. Your active listings will appear here.
                    </p>
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
                <div className="space-y-6">
                  {messages.map((message) => {
                    const isIncoming = message.toUserId === user.id;
                    
                    // Check if message is already read or being processed
                    const shouldMarkAsRead = isIncoming && !message.isRead && !markAsReadMutation.isPending;
                    
                    // Mark incoming message as read when viewed
                    if (shouldMarkAsRead) {
                      markAsReadMutation.mutate(message.id);
                    }
                    
                    return (
                      <Card key={message.id} className={isIncoming ? "border-l-4 border-l-primary" : ""}>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {isIncoming ? message.fromUser.name.charAt(0).toUpperCase() : message.toUser.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {isIncoming ? message.fromUser.name : `To: ${message.toUser.name}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Just now'}
                                    {message.car && ` · About: ${message.car.make} ${message.car.model}`}
                                  </p>
                                </div>
                              </div>
                              {isIncoming && (
                                <Badge variant={message.isRead ? "outline" : "default"} className="ml-2">
                                  {message.isRead ? "Read" : "New"}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-800">{message.content}</p>
                            </div>
                            
                            {isIncoming && (
                              <div className="flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setReplyingTo({
                                    messageId: message.id,
                                    toUserId: message.fromUser.id,
                                    carId: message.carId
                                  })}
                                >
                                  Reply
                                </Button>
                              </div>
                            )}
                            
                            {replyingTo?.messageId === message.id && (
                              <div className="pt-3 border-t mt-2">
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm font-medium">Reply to {message.fromUser.name}</p>
                                  <Input
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="w-full"
                                  />
                                  <div className="flex justify-end gap-2 mt-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setReplyingTo(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={handleSendReply}
                                      disabled={sendMessageMutation.isPending || !replyMessage.trim()}
                                    >
                                      {sendMessageMutation.isPending ? (
                                        <>
                                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                          Sending...
                                        </>
                                      ) : (
                                        "Send Reply"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Payments Tab - Hidden for now */}
          </Tabs>
        </div>
      </main>
      <Footer />
      
      {/* Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your account password. Please enter your current password for verification.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your current password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter new password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm new password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}