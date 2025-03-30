import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Car as CarType, Favorite } from "@shared/schema";
import { Heart, Gauge, Fuel, Car as CarIcon, User, ExternalLink } from "lucide-react";

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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
        <div className="relative pb-[65%]">
          <img 
            src={`/uploads/default-car.jpg`} // This would be replaced with actual car image
            alt={`${car.year} ${car.make} ${car.model}`} 
            className="absolute h-full w-full object-cover" 
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
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold">{car.make} {car.model}</h3>
            <span className="font-semibold text-primary">${car.price.toLocaleString()}</span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{car.year} • {car.mileage.toLocaleString()} miles</p>
          
          <div className="flex space-x-2 mb-3">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {car.condition.charAt(0).toUpperCase() + car.condition.slice(1)}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
              {car.transmission || "Automatic"}
            </span>
          </div>
          
          <Link href={`/cars/${car.id}`}>
            <a className="text-primary text-sm font-semibold hover:text-primary/90 transition">View Details</a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="relative pb-[60%]">
        <img 
          src={`/uploads/default-car.jpg`} // This would be replaced with actual car image
          alt={`${car.year} ${car.make} ${car.model}`} 
          className="absolute h-full w-full object-cover" 
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-3 px-4">
          <span className="text-white font-semibold text-xl">${car.price.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{car.year} {car.make} {car.model}</h3>
        <p className="text-gray-600 mb-3">{car.mileage.toLocaleString()} miles • {car.location}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center text-gray-700">
            <Gauge className="mr-2 h-4 w-4 text-gray-500" />
            <span>{car.condition} condition</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Fuel className="mr-2 h-4 w-4 text-gray-500" />
            <span>{car.fuelType || "Gasoline"}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <CarIcon className="mr-2 h-4 w-4 text-gray-500" />
            <span>{car.transmission || "Automatic"}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <User className="mr-2 h-4 w-4 text-gray-500" />
            <span>5 seats</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            {car.condition === "new" ? "New" : "Used"}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {car.color}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <Link href={`/cars/${car.id}`}>
          <Button variant="link" className="text-primary font-semibold p-0 h-auto">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
