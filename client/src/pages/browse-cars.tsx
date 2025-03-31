import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CarSearch from "@/components/car/CarSearch";
import CarCard from "@/components/car/CarCard";
import { useAuth } from "@/hooks/use-auth";
import { Car, CarSearch as CarSearchType, Favorite } from "@shared/schema";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, SlidersHorizontal } from "lucide-react";

export default function BrowseCars() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(location.split("?")[1] || ""));
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Create search object from URL params
  const searchObject: CarSearchType = {
    make: searchParams.get("make") || "",
    model: searchParams.get("model") || "",
    minYear: searchParams.get("minYear") ? parseInt(searchParams.get("minYear")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined,
  };
  
  // Fetch cars based on search parameters
  const { data: cars, isLoading } = useQuery<Car[]>({
    queryKey: [`/api/cars/search`, searchObject],
    enabled: true,
  });
  
  // Fetch favorites if user is logged in
  const { data: favorites } = useQuery<Favorite[]>({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  });
  
  // Find favorite for a car
  const findFavorite = (carId: number) => {
    return favorites?.find(fav => fav.carId === carId);
  };
  
  // Handle search
  const handleSearch = (newSearchParams: CarSearchType) => {
    const params = new URLSearchParams();
    
    // Only add parameters that have meaningful values
    if (newSearchParams.make && newSearchParams.make !== "") {
      params.set("make", newSearchParams.make);
    }
    
    if (newSearchParams.model && newSearchParams.model !== "") {
      params.set("model", newSearchParams.model);
    }
    
    if (newSearchParams.minYear && newSearchParams.minYear > 0) {
      params.set("minYear", newSearchParams.minYear.toString());
    }
    
    if (newSearchParams.maxPrice && newSearchParams.maxPrice > 0) {
      params.set("maxPrice", newSearchParams.maxPrice.toString());
    }
    
    console.log("Setting URL params:", params.toString());
    setSearchParams(params);
  };
  
  // Sort cars
  const sortedCars = [...(cars || [])].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "year_new":
        return b.year - a.year;
      case "year_old":
        return a.year - b.year;
      case "mileage_low":
        return a.mileage - b.mileage;
      case "mileage_high":
        return b.mileage - a.mileage;
      default: // newest listings first based on id (higher id = newer)
        return b.id - a.id;
    }
  });
  
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="bg-primary text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Browse Cars in Cyprus</h1>
            <p className="text-white/80">
              {searchParams.toString() 
                ? "Showing filtered results" 
                : "Explore our collection of quality vehicles across Cyprus"}
            </p>
          </div>
        </div>
        
        <CarSearch 
          initialSearchParams={searchParams}
          onSearch={handleSearch}
          compact={true}
        />
        
        <div className="container mx-auto px-4 py-8">
          {/* Results count and sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              {!isLoading && (
                <p className="text-gray-700">
                  {sortedCars?.length || 0} {sortedCars?.length === 1 ? 'car' : 'cars'} found
                  {searchParams.toString() && (
                    <span className="text-gray-500 ml-1">matching your search</span>
                  )}
                </p>
              )}
            </div>
            
            <div className="flex items-center">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" />
              <span className="mr-2 text-gray-700">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Listings</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="year_new">Year: Newest First</SelectItem>
                  <SelectItem value="year_old">Year: Oldest First</SelectItem>
                  <SelectItem value="mileage_low">Mileage: Low to High</SelectItem>
                  <SelectItem value="mileage_high">Mileage: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Car listings */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedCars && sortedCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  favorite={findFavorite(car.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                <SlidersHorizontal className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No cars found</h3>
              <p className="text-gray-500 mb-4">
                {searchParams.toString() 
                  ? "No cars match your current filters. Try adjusting your search criteria."
                  : "There are no cars available at the moment."}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
