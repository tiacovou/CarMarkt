import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Car as OriginalCarType } from "@shared/schema";
import { Heart, Gauge, Fuel, Car as CarIcon, User, ArrowRight, TagIcon, BadgeCheck } from "lucide-react";

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
  
  const handleMarkAsSold = () => {
    markAsSoldMutation.mutate();
  };
  
  return (
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
        </div>
      </div>
      
      <div className="border-t border-gray-200 p-4 md:p-5 flex justify-between items-center">
        <Link href={`/cars/${car.id}`}>
          <Button variant="link" className="text-primary font-semibold p-0 h-auto text-base flex items-center">
            View Details
            <ArrowRight className="ml-1 h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Button>
        </Link>
        
        {!car.isSold && (
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
        )}
      </div>
    </div>
  );
}