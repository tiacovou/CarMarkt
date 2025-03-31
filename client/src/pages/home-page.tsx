import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SellYourCar from "@/components/home/SellYourCar";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import FeaturedMakes from "@/components/home/FeaturedMakes";
import CarSearch from "@/components/car/CarSearch";
import CarCard from "@/components/car/CarCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Car, Favorite } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch featured cars
  const { data: featuredCars, isLoading: isLoadingFeatured } = useQuery<Car[]>({
    queryKey: ["/api/cars"],
  });
  
  // Fetch favorites if user is logged in
  const { data: favorites } = useQuery<Favorite[]>({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  });
  
  // Find favorites for a car
  const findFavorite = (carId: number) => {
    return favorites?.find(fav => fav.carId === carId);
  };
  
  return (
    <>
      <Header />
      <main>
        <Hero />
        
        {/* Recent Listings - now right below Hero */}
        <section className="pt-24 pb-16 lg:pt-32 lg:pb-20 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12 pt-6">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Recent Listings</h2>
                <p className="text-gray-600 md:text-lg">Discover the latest vehicles on our marketplace</p>
              </div>
              <Link href="/browse">
                <a className="text-primary hover:text-primary/90 font-medium flex items-center mt-2 sm:mt-0">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </div>
            
            {isLoadingFeatured ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : featuredCars && featuredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {featuredCars.slice(0, 4).map((car) => (
                  <CarCard 
                    key={car.id} 
                    car={car} 
                    compact={true}
                    favorite={findFavorite(car.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 mb-4 md:text-lg">No recent cars available at the moment.</p>
                <Link href="/sell">
                  <Button size="lg" className="px-6">Be the first to list a car</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
        
        <WhyChooseUs />
        
        <FeaturedMakes />
        
        <SellYourCar />
      </main>
      <Footer />
    </>
  );
}
