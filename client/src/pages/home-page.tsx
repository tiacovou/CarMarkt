import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import SellYourCar from "@/components/home/SellYourCar";
import WhyChooseUs from "@/components/home/WhyChooseUs";
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
        
        {/* Recent Listings - Enhanced Design */}
        <section className="py-14 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="container mx-auto px-4 lg:px-6 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 lg:mb-12">
              <div>
                <div className="inline-block mb-3">
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Just Added</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-primary bg-clip-text text-transparent">Recent Listings</h2>
                <p className="text-gray-600 md:text-lg max-w-xl">Discover the latest vehicles on our marketplace, updated daily with fresh finds</p>
              </div>
              <Link href="/browse">
                <Button variant="outline" className="group mt-4 sm:mt-0 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300">
                  <span>View All Listings</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {isLoadingFeatured ? (
              <div className="flex justify-center items-center py-16 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                  <p className="text-gray-500">Loading amazing cars for you...</p>
                </div>
              </div>
            ) : featuredCars && featuredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {featuredCars.slice(0, 4).map((car, index) => (
                  <div 
                    key={car.id}
                    className={`car-card-hover animate-fadeInUp animate-delay-${index * 100} opacity-0`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CarCard 
                      car={car} 
                      compact={true}
                      favorite={findFavorite(car.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-700 mb-5 text-lg">No recent cars available at the moment.</p>
                <Link href="/sell">
                  <Button size="lg" className="px-8 py-6 text-base shadow-lg hover:shadow-primary/20 transition-all">
                    Be the first to list a car
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
        
        <WhyChooseUs />
        
        <SellYourCar />
      </main>
      <Footer />
    </>
  );
}
