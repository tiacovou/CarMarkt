import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Car, CarImage, Favorite, User as UserType } from "@shared/schema";
import { useParams } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Mail,
  Share2,
  Info,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Car as CarIcon,
  Paintbrush,
  MessageSquare,
  User as UserIcon,
  Phone,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Eye,
} from "lucide-react";

interface CarDetailProps {
  carId: number;
}

export default function CarDetail({ carId }: CarDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contactMessage, setContactMessage] = useState("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          goToPreviousImage();
          break;
        case "ArrowRight":
          goToNextImage();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, currentImageIndex]);
  
  // Fetch car data
  const { data: car, isLoading: isLoadingCar } = useQuery<Car>({
    queryKey: [`/api/cars/${carId}`],
  });
  
  // Fetch car images
  const { data: carImages, isLoading: isLoadingImages } = useQuery<CarImage[]>({
    queryKey: [`/api/cars/${carId}/images`],
    enabled: !!carId,
  });
  
  // Fetch user favorites to check if car is favorited
  const { data: favorites, isLoading: isLoadingFavorites } = useQuery<Favorite[]>({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  });
  
  // Fetch seller information
  const { data: seller } = useQuery<{id: number; name: string; phone?: string}>({
    queryKey: [`/api/users/${car?.userId}`],
    enabled: !!car?.userId,
  });
  
  const favorite = favorites?.find(fav => fav.carId === carId);
  const isFavorite = !!favorite;
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite && favorite) {
        await apiRequest("DELETE", `/api/user/favorites/${favorite.id}`);
        return null;
      } else {
        const res = await apiRequest("POST", "/api/user/favorites", { carId });
        return await res.json();
      }
    },
    onSuccess: () => {
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
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!car) return null;
      
      const response = await apiRequest("POST", "/api/messages", {
        toUserId: car.userId,
        carId: car.id,
        content: contactMessage
      });
      
      return await response.json();
    },
    onSuccess: () => {
      setContactDialogOpen(false);
      setContactMessage("");
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the seller.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleFavoriteToggle = () => {
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
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to the seller",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate();
  };
  
  // Image lightbox functions
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };
  
  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };
  
  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  if (isLoadingCar) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <div className="flex gap-4 mt-4">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-20 w-20 rounded-lg" />
            </div>
          </div>
          <div>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!car) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold mb-2">Car Not Found</h2>
        <p className="text-gray-600 mb-6">The car you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <a href="/browse">Browse Other Cars</a>
        </Button>
      </div>
    );
  }
  
  // Mock images for demonstration (would be replaced by actual car images)
  const images = carImages?.length ? carImages : [
    { id: 1, imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537", isPrimary: true },
    { id: 2, imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2", isPrimary: false },
    { id: 3, imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888", isPrimary: false },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Car Images */}
        <div className="lg:col-span-2">
          <Carousel className="mb-4 rounded-xl overflow-hidden border">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <AspectRatio ratio={16 / 9}>
                    <div 
                      className="relative w-full h-full cursor-pointer"
                      onClick={() => openLightbox(index)}
                    >
                      <img 
                        src={image.imageUrl}
                        alt={`${car.year} ${car.make} ${car.model} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 p-1 rounded-full">
                        <Maximize2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </AspectRatio>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          
          {/* Thumbnails */}
          <div className="grid grid-cols-5 gap-2">
            {images.slice(0, 5).map((image, index) => (
              <div 
                key={index} 
                className="relative rounded-md overflow-hidden border cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <AspectRatio ratio={1 / 1}>
                  <img 
                    src={image.imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover hover:opacity-80 transition"
                  />
                </AspectRatio>
              </div>
            ))}
          </div>
          
          {/* Car Details Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-gray-700 font-medium">Year</span>
                    </div>
                    <p className="text-gray-900">{car.year}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Gauge className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-gray-700 font-medium">Mileage</span>
                    </div>
                    <p className="text-gray-900">{car.mileage.toLocaleString()} km</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Fuel className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-gray-700 font-medium">Fuel Type</span>
                    </div>
                    <p className="text-gray-900">{car.fuelType || "Gasoline"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CarIcon className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-gray-700 font-medium">Transmission</span>
                    </div>
                    <p className="text-gray-900">{car.transmission || "Automatic"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Paintbrush className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-gray-700 font-medium">Color</span>
                    </div>
                    <p className="text-gray-900">{car.color}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-gray-700 font-medium">Condition</span>
                    </div>
                    <p className="text-gray-900 capitalize">{car.condition}</p>
                  </div>
                </div>
              </TabsContent>
              

              <TabsContent value="description" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {car.description || "No description provided by the seller."}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Right Column - Car Info & Actions */}
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h1 className="text-2xl font-bold mb-1">{car.year} {car.make} {car.model}</h1>
            <p className="text-gray-600 mb-4">{car.mileage.toLocaleString()} km • {car.location}</p>
            
            <div className="flex space-x-2 mb-4">
              <Badge className="capitalize bg-blue-100 hover:bg-blue-100 text-blue-800">
                {car.condition}
              </Badge>
              {car.transmission && (
                <Badge variant="outline">
                  {car.transmission}
                </Badge>
              )}
              {car.isSold && (
                <Badge className="bg-red-500 hover:bg-red-500 text-white">
                  SOLD
                </Badge>
              )}
            </div>
            
            <div className="border-t border-b py-4 my-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Price</span>
                <span className="text-3xl font-bold text-primary">€{car.price.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{car.location}</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Listed on {car.createdAt ? new Date(car.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-6">
              <Eye className="h-4 w-4 mr-2" />
              <span>{car.viewCount} views</span>
            </div>
            
            <div className="flex flex-col space-y-3">
              {/* Contact seller - only show if logged in and not own car */}
              {user && user.id !== car.userId && (
                <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={!!car?.isSold}
                      title={car?.isSold ? "This car has been sold" : undefined}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {car?.isSold ? "Car Sold" : "Contact Seller"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact Seller</DialogTitle>
                      <DialogDescription>
                        Send a message to the seller about this {car.year} {car.make} {car.model}.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSendMessage}>
                      <div className="space-y-4 py-4">
                        <Textarea 
                          placeholder="Hi, I'm interested in your car. Is it still available?"
                          className="min-h-[120px]"
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={sendMessageMutation.isPending || !contactMessage.trim()}
                        >
                          {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Save button */}
              <Button 
                variant={isFavorite ? "destructive" : "outline"} 
                className={isFavorite ? "" : "border-gray-300"}
                onClick={handleFavoriteToggle}
                disabled={toggleFavoriteMutation.isPending}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Remove from Favorites" : "Save to Favorites"}
              </Button>
              
              {/* Share button */}
              <Button variant="outline" className="border-gray-300" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: "Link copied",
                  description: "The link to this car has been copied to your clipboard.",
                });
              }}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Listing
              </Button>
            </div>
          </div>
          
          {/* Seller info */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">About the Seller</h3>
            <div className="flex items-center mb-4">
              <div className="bg-gray-200 h-12 w-12 rounded-full flex items-center justify-center mr-3">
                <UserIcon className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <p className="font-medium">{seller?.name || "Loading..."}</p>
                <p className="text-gray-600 text-sm">Car Seller</p>
              </div>
            </div>

            
            {/* Phone number - only shown if user is logged in */}
            {user && seller?.phone && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    Phone Number
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                  >
                    {showPhoneNumber ? "Hide" : "Show"}
                  </Button>
                </div>
                {showPhoneNumber ? (
                  <p className="text-primary font-medium">{seller.phone}</p>
                ) : (
                  <p className="text-gray-500">●●●●●●●●●●</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {showPhoneNumber ? 
                    "You can now contact the seller directly." : 
                    "Click 'Show' to reveal the phone number."}
                </p>
              </div>
            )}
            
            {!user && (
              <div className="border-t pt-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <AlertTriangle className="h-4 w-4 text-amber-500 inline mr-1" />
                    Log in to view seller's phone number
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full flex flex-col justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the content
          >
            {/* Close button */}
            <button 
              type="button"
              className="absolute top-4 right-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition z-10"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Image counter */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
            
            {/* Main image */}
            <div className="relative max-h-[80vh] flex items-center justify-center p-4">
              <img 
                src={images[currentImageIndex].imageUrl} 
                alt={`${car.year} ${car.make} ${car.model} - Full size`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            
            {/* Navigation buttons */}
            <button 
              type="button"
              className="absolute left-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousImage();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <button 
              type="button"
              className="absolute right-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            
            {/* Thumbnails */}
            <div className="flex justify-center mt-4 px-4 gap-2 pb-4 overflow-x-auto">
              {images.map((image, index) => (
                <div 
                  key={index}
                  className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                >
                  <img 
                    src={image.imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
