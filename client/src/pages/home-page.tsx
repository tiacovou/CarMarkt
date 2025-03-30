import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import SellYourCar from "@/components/home/SellYourCar";
import Testimonials from "@/components/home/Testimonials";
import CarSearch from "@/components/car/CarSearch";
import CarCard from "@/components/car/CarCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Car, Favorite } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  
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
        <CarSearch />
        
        <HowItWorks />
        
        <SellYourCar />
        
        {/* Recent Listings */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Recent Listings</h2>
              <Link href="/browse">
                <a className="text-primary hover:text-primary/90 font-medium flex items-center">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </div>
            
            {isLoadingFeatured ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : featuredCars && featuredCars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No recent cars available at the moment.</p>
                <Link href="/sell">
                  <Button>Be the first to list a car</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
        
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
