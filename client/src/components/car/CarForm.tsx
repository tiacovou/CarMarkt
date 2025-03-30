import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCarSchema, InsertCar } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extended car form schema with validations
const carFormSchema = insertCarSchema.extend({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number()
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 1, `Year cannot be later than ${new Date().getFullYear() + 1}`),
  price: z.number()
    .int("Price must be a whole number")
    .min(1, "Price must be greater than 0"),
  mileage: z.number()
    .int("Mileage must be a whole number")
    .min(0, "Mileage cannot be negative"),
  location: z.string().min(1, "Location is required"),
  color: z.string().min(1, "Color is required"),
  condition: z.enum(["new", "excellent", "good", "fair", "poor"], {
    errorMap: () => ({ message: "Please select a condition" }),
  }),
  description: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
});

const carMakes = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz", 
  "Audi", "Volkswagen", "Hyundai", "Kia", "Subaru", "Lexus", "Jeep", "Tesla"
];

const fuelTypes = [
  "Gasoline", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"
];

const transmissionTypes = [
  "Automatic", "Manual", "CVT", "Semi-Automatic", "Dual-Clutch"
];

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface ImageUpload {
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  id?: number;
}

export default function CarForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof carFormSchema>>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      location: "",
      color: "",
      condition: "good",
      description: "",
      fuelType: "",
      transmission: ""
    }
  });
  
  // Create car mutation
  const createCarMutation = useMutation({
    mutationFn: async (values: z.infer<typeof carFormSchema>) => {
      const res = await apiRequest("POST", "/api/cars", values);
      return await res.json();
    },
    onSuccess: async (car) => {
      // Upload images if any
      if (images.length > 0) {
        await uploadImages(car.id);
      } else {
        // If no images, just navigate to the new car page
        finishSubmission(car.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating listing",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    
    // Validate file size and type
    const invalidFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return !isImage || !isValidSize;
    });
    
    if (invalidFiles.length > 0) {
      setUploadError("Some files were not added. Images must be under 5MB.");
      setTimeout(() => setUploadError(null), 5000);
    }
    
    // Filter valid files and add to images state
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isImage && isValidSize;
    });
    
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: "idle" as UploadStatus,
      progress: 0
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };
  
  // Remove image from upload list
  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };
  
  // Upload images to server
  const uploadImages = async (carId: number) => {
    let success = true;
    
    for (let i = 0; i < images.length; i++) {
      // Update image status to uploading
      setImages(prev => {
        const newImages = [...prev];
        newImages[i] = { ...newImages[i], status: "uploading", progress: 0 };
        return newImages;
      });
      
      try {
        const formData = new FormData();
        formData.append('image', images[i].file);
        
        const response = await fetch(`/api/cars/${carId}/images`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload image: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update image status to success
        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = { 
            ...newImages[i], 
            status: "success", 
            progress: 100,
            id: data.id
          };
          return newImages;
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        
        // Update image status to error
        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = { ...newImages[i], status: "error", progress: 0 };
          return newImages;
        });
        
        success = false;
        
        toast({
          title: "Error uploading image",
          description: "One or more images failed to upload. You can try again later.",
          variant: "destructive",
        });
      }
    }
    
    // Finish submission after all uploads
    finishSubmission(carId);
  };
  
  const finishSubmission = (carId: number) => {
    queryClient.invalidateQueries({ queryKey: ["/api/user/cars"] });
    queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
    
    toast({
      title: "Success!",
      description: "Your car listing has been created.",
    });
    
    // Navigate to the new car page
    navigate(`/cars/${carId}`);
  };
  
  const onSubmit = (values: z.infer<typeof carFormSchema>) => {
    createCarMutation.mutate(values);
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Create Car Listing</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Car basic details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carMakes.map((make) => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Camry, Civic, F-150" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Car additional details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mileage</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Red, Blue, Silver" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Optional details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="transmission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transmission (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transmissionTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fuelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Type (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fuelTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York, NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your car, its features, history, and any other relevant details" 
                    className="h-32"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Image upload */}
          <div className="space-y-4">
            <div>
              <FormLabel>Car Images</FormLabel>
              <FormDescription>
                Upload clear photos of your car. The first image will be the main photo shown in listings.
              </FormDescription>
            </div>
            
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className="relative border rounded-md overflow-hidden aspect-square"
                >
                  <img 
                    src={image.preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Upload status overlay */}
                  {image.status === "uploading" && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    &times;
                  </Button>
                  
                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-primary text-white text-xs py-0.5 px-2 rounded">
                      Primary
                    </div>
                  )}
                </div>
              ))}
              
              {/* Upload button */}
              {images.length < 10 && (
                <label className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            
            {images.length === 0 && (
              <p className="text-sm text-amber-600">
                At least one image is recommended (you can add images after creating the listing).
              </p>
            )}
          </div>
          
          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={createCarMutation.isPending}
          >
            {createCarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createCarMutation.isPending ? "Creating Listing..." : "Create Listing"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
