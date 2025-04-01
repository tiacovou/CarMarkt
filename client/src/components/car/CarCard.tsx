import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Car as OriginalCarType, Favorite } from "@shared/schema";
import { Heart, Gauge, Fuel, Car as CarIcon, User, ArrowRight, Eye, Calendar } from "lucide-react";

// Extended car type with primary image URL
type CarType = OriginalCarType & {
  primaryImageUrl?: string | null;
};

interface CarCardProps {
  car: CarType;
  favorite?: Favorite | null;
  featured?: boolean;
  compact?: boolean;
}

export default function CarCard({ car, favorite, featured = false, compact = false }: CarCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(!!favorite);
  
  // Toogle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite && favorite) {
        await apiRequest("DELETE", `/api/user/favorites/${favorite.id}`);
        return null;
      } else {
        const res = await apiRequest("POST", "/api/user/favorites", { carId: car.id });
        return await res.json();
      }
    },
    onSuccess: (data) => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite ? "Car has been removed from your saved listings" : "Car has been added to your saved listings",
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
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to save cars to your favorites",
        variant: "destructive",
      });
      return;
    }
    
    toggleFavoriteMutation.mutate();
  };
  
  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group">
        <div className="relative pb-[65%]">
          <img 
            src={car.primaryImageUrl || `/uploads/default-car.jpg`}
            alt={`${car.year} ${car.make} ${car.model}`} 
            className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          <div className="absolute top-3 right-3">
            <Button 
              size="icon" 
              variant="ghost" 
              className={`bg-white bg-opacity-90 p-1.5 rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
              onClick={handleFavoriteToggle}
            >
              <Heart className={isFavorite ? 'fill-current' : ''} size={16} />
            </Button>
          </div>
          {car.isSold && (
            <div className="absolute top-3 left-3">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-2 px-3">
            <span className="text-white font-semibold text-lg">€{car.price.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-2">
            <h3 className="font-bold text-base md:text-lg truncate">{car.year} {car.make} {car.model}</h3>
            <p className="text-gray-600 text-sm mb-2 truncate">{car.mileage.toLocaleString()} km • {car.location}</p>
          </div>
          
          <div className="flex space-x-2 mb-3">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {car.condition.charAt(0).toUpperCase() + car.condition.slice(1)}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
              {car.transmission || "Automatic"}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center text-gray-500 text-xs">
              <Calendar className="h-3 w-3 mr-0.5" />
              <span>{car.createdAt ? new Date(car.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Eye className="h-3 w-3 mr-0.5" />
              <span>{car.viewCount || 0}</span>
            </div>
          </div>
          
          <Link href={`/cars/${car.id}`}>
            <a className="text-primary text-sm font-semibold hover:text-primary/90 transition flex items-center">
              View Details <ArrowRight className="ml-1 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group">
      <div className="relative pb-[60%]">
        <img 
          src={car.primaryImageUrl || `/uploads/default-car.jpg`}
          alt={`${car.year} ${car.make} ${car.model}`} 
          className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute top-4 right-4">
          <Button 
            size="icon" 
            variant="ghost" 
            className={`bg-white bg-opacity-90 p-2 rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            onClick={handleFavoriteToggle}
          >
            <Heart className={isFavorite ? 'fill-current' : ''} />
          </Button>
        </div>
        {car.isSold && (
          <div className="absolute top-4 left-4">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full">SOLD</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-3 px-4">
          <span className="text-white font-semibold text-xl md:text-2xl">€{car.price.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="p-4 md:p-5">
        <h3 className="font-bold text-lg md:text-xl mb-1">{car.year} {car.make} {car.model}</h3>
        <p className="text-gray-600 mb-4">{car.mileage.toLocaleString()} km • {car.location}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="flex items-center text-gray-700">
            <Gauge className="mr-2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <span className="text-sm md:text-base">{car.condition} condition</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Fuel className="mr-2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <span className="text-sm md:text-base">{car.fuelType || "Gasoline"}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <CarIcon className="mr-2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <span className="text-sm md:text-base">{car.transmission || "Automatic"}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <User className="mr-2 h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <span className="text-sm md:text-base">5 seats</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            {car.condition === "new" ? "New" : "Used"}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {car.color}
          </span>
          {car.fuelType && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
              {car.fuelType}
            </span>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-4 md:p-5">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{car.createdAt ? new Date(car.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Eye className="h-3.5 w-3.5 mr-1" />
            <span>{car.viewCount || 0} views</span>
          </div>
        </div>
        
        <Link href={`/cars/${car.id}`}>
          <Button variant="link" className="text-primary font-semibold p-0 h-auto text-base md:text-lg flex items-center group-hover:underline">
            View Details
            <ArrowRight className="ml-1 h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Button>
        </Link>
      </div>
    </div>
  );
}