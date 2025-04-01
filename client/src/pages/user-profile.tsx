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
import { Loader2, User as UserIcon, Mail, Phone as PhoneIcon, LogOut, Edit, Car, Heart, MessageSquare, Plus, CreditCard, Lock, Check, X, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Car as CarType, Favorite, Message as MessageType, Payment, User } from "@shared/schema";

// Extended Message interface that includes populated user and car data
interface Message extends MessageType {
  fromUser?: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  toUser?: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  car?: {
    id: number;
    make: string;
    model: string;
  };
}
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
  
  // Fetch all cars (for favorites and messages)
  const { data: allCars } = useQuery<CarType[]>({
    queryKey: ["/api/cars"],
    // Always enable this query as we need car data for both favorites and messages
    enabled: !!user,
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
  
  // State for conversation management
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  // Group messages by conversation partners
  const conversationPartners = messages ? Array.from(new Set(
    messages.map(msg => 
      msg.fromUserId === user?.id ? msg.toUserId : msg.fromUserId
    ).filter(id => id !== user?.id)
  )) : [];
  
  // Get user details for each conversation partner
  const conversationUsers = conversationPartners.map(partnerId => {
    // Find a message that involves this partner to get their name
    const message = messages?.find(msg => 
      msg.fromUserId === partnerId || msg.toUserId === partnerId
    );
    
    if (!message) return null;
    
    // Get name with fallback in case user info isn't loaded yet
    const name = message.fromUserId === partnerId 
      ? (message.fromUser?.name || `User ${partnerId}`) 
      : (message.toUser?.name || `User ${partnerId}`);
    
    return {
      id: partnerId,
      name,
      // Count unread messages from this user
      unreadCount: messages?.filter(msg => 
        msg.fromUserId === partnerId && 
        msg.toUserId === user?.id && 
        !msg.isRead
      ).length || 0
    };
  }).filter(Boolean) as Array<{id: number, name: string, unreadCount: number}>;
  
  // Get conversation for selected user
  const selectedConversation = selectedUser ? 
    messages?.filter(msg => 
      (msg.fromUserId === user?.id && msg.toUserId === selectedUser) || 
      (msg.fromUserId === selectedUser && msg.toUserId === user?.id)
    ).sort((a, b) => {
      // Handle null dates safely
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    }) : [];
  
  // Get car details for the conversation
  // First, find the carId from the conversation
  const conversationCarId = selectedConversation && selectedConversation.length > 0 
    ? selectedConversation[0].carId 
    : null;
  
  // Then fetch the car details
  const conversationCar = allCars && conversationCarId
    ? allCars.find(car => car.id === conversationCarId) 
    : null;
    
  // Log car details for debugging
  useEffect(() => {
    if (selectedUser) {
      console.log("Conversation car ID:", conversationCarId);
      console.log("All cars:", allCars);
      console.log("Conversation car:", conversationCar);
    }
  }, [selectedUser, conversationCarId, allCars, conversationCar]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { toUserId: number; carId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      // Reset the message form
      setNewMessage("");
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
  
  // Handle sending a message in the conversation view
  const handleSendMessage = () => {
    if (!selectedUser || !newMessage.trim()) {
      console.log("Missing required data:", { selectedUser, conversationCarId, message: newMessage.trim() });
      return;
    }
    
    // If we don't have a car ID from the conversation, use a fallback
    // This might happen if there's no previous messages yet
    // For development/testing only - in production always ensure a proper carId
    const carId = conversationCarId || 1; // Fallback to first car if needed
    
    console.log("Sending message with:", { toUserId: selectedUser, carId, content: newMessage });
    
    sendMessageMutation.mutate({
      toUserId: selectedUser,
      carId,
      content: newMessage
    });
  };
  
  // Handle sending a reply (for backward compatibility)
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
                    <p className="text-gray-500 text-sm mb-4">Member since {new Date().toLocaleDateString('en-GB')}</p>
                    
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
                      
                      {/* Admin Section - Removed as requested */}
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
                          {user.freeListingsUsed < 2 ? (
                            `You have ${2 - user.freeListingsUsed} free car listing${user.freeListingsUsed === 1 ? '' : 's'} available this month.`
                          ) : (
                            "You have used your free listings for this month."
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Conversation List */}
                  <div className="md:col-span-1">
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b">
                        <h3 className="font-medium">Conversations</h3>
                      </div>
                      <div className="divide-y">
                        {conversationUsers.map(partner => (
                          <div 
                            key={partner.id}
                            onClick={() => setSelectedUser(partner.id)}
                            className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser === partner.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {partner.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{partner.name}</span>
                            </div>
                            {partner.unreadCount > 0 && (
                              <Badge className="ml-2">{partner.unreadCount}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Message Thread */}
                  <div className="md:col-span-2">
                    {selectedUser ? (
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {conversationUsers.find(u => u.id === selectedUser)?.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-base font-medium">
                                  {conversationUsers.find(u => u.id === selectedUser)?.name}
                                </CardTitle>
                              </div>
                            </div>
                            
                            {conversationCar && (
                              <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500 mb-1">Conversation about:</span>
                                  {conversationCar ? (
                                    <Link 
                                      to={`/cars/${conversationCar.id}`} 
                                      className="text-sm font-medium text-primary hover:underline flex items-center"
                                    >
                                      {conversationCar.make} {conversationCar.model} {conversationCar.year}
                                      <ArrowUpRight className="ml-1 h-3 w-3" />
                                    </Link>
                                  ) : (
                                    <span className="text-sm text-gray-400">Car information unavailable</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto">
                          <div className="space-y-4">
                            {selectedConversation?.map(message => {
                              const isFromMe = message.fromUserId === user.id;
                              
                              // Mark message as read if we're viewing it and it's not read yet
                              if (!isFromMe && !message.isRead && !markAsReadMutation.isPending) {
                                markAsReadMutation.mutate(message.id);
                              }
                              
                              return (
                                <div 
                                  key={message.id} 
                                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div 
                                    className={`max-w-[80%] rounded-lg p-3 ${
                                      isFromMe 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}
                                  >
                                    <p>{message.content}</p>
                                    <div className={`text-xs mt-1 ${isFromMe ? 'text-primary-50' : 'text-gray-500'}`}>
                                      {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                        <div className="p-3 border-t">
                          <div className="flex gap-2">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-grow"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button 
                              onClick={handleSendMessage}
                              disabled={sendMessageMutation.isPending || !newMessage.trim()}
                            >
                              {sendMessageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Send"
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="h-full flex items-center justify-center">
                        <CardContent className="flex flex-col items-center py-12 text-center">
                          <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-gray-500">Select a conversation to view messages</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
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