import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Car as OriginalCarType } from "@shared/schema";
import { 
  Heart, Gauge, Fuel, Car as CarIcon, User, ArrowRight, 
  TagIcon, BadgeCheck, RefreshCw, Clock, AlertTriangle, 
  CreditCard, Eye, Calendar
} from "lucide-react";

// Extended car type with primary image URL
type CarType = OriginalCarType & {
  primaryImageUrl?: string | null;
};

interface UserCarCardProps {
  car: CarType;
}

export default function UserCarCard({ car }: UserCarCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [, navigate] = useLocation();
  
  // Check if the listing is expired
  const isExpired = car.expiresAt ? new Date(car.expiresAt) < new Date() : false;
  
  // Format expiration date
  const formatExpirationDate = () => {
    if (!car.expiresAt) return "No expiration date";
    
    const expiresAt = new Date(car.expiresAt);
    const today = new Date();
    const diffTime = expiresAt.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "Expired";
    } else if (diffDays === 0) {
      return "Expires today";
    } else if (diffDays === 1) {
      return "Expires tomorrow";
    } else if (diffDays <= 7) {
      return `Expires in ${diffDays} days`;
    } else {
      return `Expires on ${expiresAt.toLocaleDateString()}`;
    }
  };
  
  // Mark car as sold mutation
  const markAsSoldMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cars/${car.id}/sold`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/cars"] });
      toast({
        title: "Car marked as sold",
        description: "Your car has been marked as sold successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mark car as available mutation
  const markAsAvailableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cars/${car.id}/unsold`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/cars"] });
      toast({
        title: "Car marked as available",
        description: "Your car has been marked as available successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Renew car listing mutation
  const renewListingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cars/${car.id}/renew`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/cars"] });
      toast({
        title: "Listing renewed",
        description: "Your car listing has been extended for another month",
      });
      setPaymentRequired(false);
    },
    onError: (error: any) => {
      if (error.status === 402) {
        setPaymentRequired(true);
        toast({
          title: "Payment required",
          description: "You need to make a payment to renew this listing",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });
  
  const handleMarkAsSold = () => {
    markAsSoldMutation.mutate();
  };
  
  const handleMarkAsAvailable = () => {
    markAsAvailableMutation.mutate();
  };
  
  const handleRenewListing = () => {
    renewListingMutation.mutate();
  };
  
  const handleClosePaymentDialog = () => {
    setPaymentRequired(false);
  };
  
  const handleProceedToPayment = () => {
    navigate('/payment?type=listing&carId=' + car.id);
  };
  
  const handleSubscribe = () => {
    navigate('/subscribe');
  };
  
  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group relative">
        {/* Sold Badge */}
        {car.isSold && (
          <div className="absolute top-0 left-0 w-full z-10 bg-green-600 text-white text-center py-1.5 px-2 font-medium">
            <div className="flex items-center justify-center">
              <BadgeCheck className="h-4 w-4 mr-1" />
              <span>SOLD</span>
            </div>
          </div>
        )}
        
        {/* Expired Badge */}
        {!car.isSold && isExpired && (
          <div className="absolute top-0 left-0 w-full z-10 bg-red-600 text-white text-center py-1.5 px-2 font-medium">
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>EXPIRED</span>
            </div>
          </div>
        )}
        
        <div className="relative pb-[60%]">
          <img 
            src={car.primaryImageUrl || `/uploads/default-car.jpg`}
            alt={`${car.year} ${car.make} ${car.model}`} 
            className={`absolute h-full w-full object-cover ${car.isSold ? 'opacity-70' : ''} group-hover:scale-105 transition-transform duration-300`} 
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-3 px-4">
            <span className="text-white font-semibold text-xl md:text-2xl">€{car.price.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="p-4 md:p-5">
          <h3 className="font-bold text-lg md:text-xl mb-1">{car.year} {car.make} {car.model}</h3>
          <p className="text-gray-600 mb-4">{car.mileage.toLocaleString()} km • {car.location}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center text-gray-700">
              <Gauge className="mr-2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
              <span className="text-sm md:text-base">{car.condition} condition</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Fuel className="mr-2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
              <span className="text-sm md:text-base">{car.fuelType || "Gasoline"}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {car.condition === "new" ? "New" : "Used"}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {car.color}
            </span>
            
            {car.expiresAt && (
              <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                isExpired 
                  ? 'bg-red-100 text-red-800' 
                  : new Date(car.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                <Clock className="h-3 w-3 mr-1" />
                {formatExpirationDate()}
              </span>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-4 md:p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{car.createdAt ? new Date(car.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <Eye className="h-3.5 w-3.5 mr-1" />
              <span>{car.viewCount || 0} views</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Link href={`/cars/${car.id}`}>
              <Button variant="link" className="text-primary font-semibold p-0 h-auto text-base flex items-center">
                View Details
                <ArrowRight className="ml-1 h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </Link>
          
            <div className="flex flex-wrap gap-2">
              {/* Renewal button for expired or expiring soon listings */}
              {!car.isSold && (isExpired || (car.expiresAt && new Date(car.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000)) && (
                <Button 
                  onClick={handleRenewListing} 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  disabled={renewListingMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {renewListingMutation.isPending ? "Renewing..." : "Renew Listing"}
                </Button>
              )}
              
              {/* Mark as sold/available button */}
              {!car.isSold ? (
                <Button 
                  onClick={handleMarkAsSold} 
                  variant="outline" 
                  size="sm" 
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                  disabled={markAsSoldMutation.isPending}
                >
                  <TagIcon className="h-4 w-4 mr-1" />
                  {markAsSoldMutation.isPending ? "Marking as sold..." : "Mark as Sold"}
                </Button>
              ) : (
                <Button 
                  onClick={handleMarkAsAvailable} 
                  variant="outline" 
                  size="sm" 
                  className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                  disabled={markAsAvailableMutation.isPending}
                >
                  <TagIcon className="h-4 w-4 mr-1" />
                  {markAsAvailableMutation.isPending ? "Marking as available..." : "Mark as Available"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment required dialog */}
      <Dialog open={paymentRequired} onOpenChange={handleClosePaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
            <DialogDescription>
              You've used all your free car listings for this month. You need to make a payment to renew this listing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center space-x-4 rounded-lg border border-gray-200 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-900">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">One-time Payment</p>
                <p className="text-sm text-gray-500">Pay €1 to renew this listing for 1 month</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 rounded-lg border border-gray-200 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-900">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Monthly Subscription</p>
                <p className="text-sm text-gray-500">Subscribe for €5/month for unlimited listings</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClosePaymentDialog}>Cancel</Button>
            <Button variant="outline" onClick={handleProceedToPayment}>
              One-time Payment
            </Button>
            <Button onClick={handleSubscribe}>
              Subscribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}