import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCarSchema } from "@shared/schema";
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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ArrowLeft, ArrowRight } from "lucide-react";
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
  description: z.string().min(1, "Description is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
});

// Car makes and models mapping
const carMakesAndModels: Record<string, string[]> = {
  "Toyota": ["Corolla", "Camry", "RAV4", "Yaris", "Prius", "Land Cruiser", "Hilux", "C-HR", "Auris"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Jazz", "Pilot", "Fit"],
  "Ford": ["Focus", "Fiesta", "Mustang", "Escape", "Explorer", "F-150", "Ranger", "Kuga"],
  "Chevrolet": ["Malibu", "Cruze", "Spark", "Silverado", "Tahoe", "Camaro", "Corvette"],
  "Nissan": ["Micra", "Altima", "Sentra", "Juke", "Qashqai", "X-Trail", "Navara", "Leaf"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "M3", "M5", "i3", "i8"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "G-Class"],
  "Audi": ["A3", "A4", "A6", "Q3", "Q5", "Q7", "TT", "R8", "e-tron"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Arteon", "ID.3", "ID.4", "T-Roc"],
  "Hyundai": ["i10", "i20", "i30", "Tucson", "Santa Fe", "Kona", "Ioniq", "Elantra", "Accent"],
  "Kia": ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Stonic", "Niro", "Soul", "Stinger"],
  "Subaru": ["Impreza", "Forester", "Outback", "Legacy", "Crosstrek", "WRX", "BRZ"],
  "Lexus": ["IS", "ES", "LS", "UX", "NX", "RX", "LX", "RC", "LC"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
  "Mazda": ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9", "MX-5 Miata"],
  "Mitsubishi": ["Mirage", "Outlander", "Eclipse Cross", "ASX", "Pajero", "L200"],
  "Peugeot": ["208", "308", "508", "2008", "3008", "5008", "Partner", "Rifter"],
  "Citroen": ["C1", "C3", "C4", "C5", "Berlingo", "C3 Aircross", "C5 Aircross", "Spacetourer"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Koleos", "Zoe", "Twingo", "Scenic"],
  "Fiat": ["500", "Panda", "Tipo", "500X", "500L", "124 Spider"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Giulietta", "4C", "Tonale"],
};

const carMakes = Object.keys(carMakesAndModels);

// Cyprus towns/cities
const cyprusTowns = [
  "Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta"
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

// Define form steps
type FormStep = "basic" | "details" | "photos" | "description";

export default function SimpleMultiStepCarForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [progress, setProgress] = useState(25);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof carFormSchema>>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      location: "",
      color: "", // Empty color field
      condition: "good",
      description: "",
      fuelType: "",
      transmission: ""
    },
    mode: "onChange"
  });
  
  // Watch for make changes to update available models
  const selectedMake = form.watch("make");
  
  useEffect(() => {
    if (selectedMake) {
      const models = carMakesAndModels[selectedMake] || [];
      setAvailableModels(models);
      
      // Clear model when make changes
      form.setValue("model", "");
    } else {
      setAvailableModels([]);
    }
  }, [selectedMake, form]);
  
  // Create car mutation
  const createCarMutation = useMutation({
    mutationFn: async (values: z.infer<typeof carFormSchema>) => {
      if (images.length === 0) {
        throw new Error("At least one image is required");
      }
      
      const res = await apiRequest("POST", "/api/cars", values);
      return await res.json();
    },
    onSuccess: async (car) => {
      await uploadImages(car.id);
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
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };
  
  // Upload images to server
  const uploadImages = async (carId: number) => {
    let success = true;
    
    for (let i = 0; i < images.length; i++) {
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
    
    finishSubmission(carId);
  };
  
  const finishSubmission = (carId: number) => {
    queryClient.invalidateQueries({ queryKey: ["/api/user/cars"] });
    queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
    
    toast({
      title: "Success!",
      description: "Your car listing has been created.",
    });
    
    navigate(`/cars/${carId}`);
  };
  
  const nextStep = () => {
    const steps: FormStep[] = ["basic", "details", "photos", "description"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      setProgress((currentIndex + 2) * 25);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    const steps: FormStep[] = ["basic", "details", "photos", "description"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      setProgress(currentIndex * 25);
      window.scrollTo(0, 0);
    }
  };
  
  const validateCurrentStep = (): boolean => {
    switch(currentStep) {
      case "basic":
        return form.getFieldState("make").invalid === false &&
               form.getFieldState("model").invalid === false &&
               form.getFieldState("year").invalid === false &&
               form.getFieldState("price").invalid === false &&
               !!form.getValues("make") &&
               !!form.getValues("model");
      case "details":
        return form.getFieldState("mileage").invalid === false &&
               form.getFieldState("color").invalid === false &&
               form.getFieldState("condition").invalid === false &&
               form.getFieldState("location").invalid === false &&
               form.getFieldState("transmission").invalid === false &&
               form.getFieldState("fuelType").invalid === false &&
               !!form.getValues("color") &&
               !!form.getValues("location") &&
               !!form.getValues("transmission") &&
               !!form.getValues("fuelType");
      case "photos":
        return images.length > 0;
      case "description":
        return form.getFieldState("description").invalid === false &&
               !!form.getValues("description");
      default:
        return false;
    }
  };
  
  const onSubmit = (values: z.infer<typeof carFormSchema>) => {
    if (currentStep === "description") {
      if (images.length === 0) {
        toast({
          title: "Image required",
          description: "At least one image is required for your car listing.",
          variant: "destructive",
        });
        setCurrentStep("photos");
        setProgress(75);
        return;
      }
      
      createCarMutation.mutate(values);
    } else {
      nextStep();
    }
  };
  
  // Handle manual next step button click
  const handleNextClick = () => {
    // Validate the current step
    if (validateCurrentStep()) {
      nextStep();
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly before proceeding.",
        variant: "destructive",
      });
    }
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Make<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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
                    <FormLabel className="flex items-center">
                      Model<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!selectedMake}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedMake ? "Select model" : "Select make first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Year<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Price (€)<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter car price" 
                        required
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                      />
                    </FormControl>
                    <FormDescription>
                      Price is mandatory and must be greater than 0
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      
      case "details":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Mileage (km)<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Color<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Gray">Gray</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="Dark Blue">Dark Blue</SelectItem>
                        <SelectItem value="Light Blue">Light Blue</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Green">Green</SelectItem>
                        <SelectItem value="Dark Green">Dark Green</SelectItem>
                        <SelectItem value="Yellow">Yellow</SelectItem>
                        <SelectItem value="Orange">Orange</SelectItem>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="Purple">Purple</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Beige">Beige</SelectItem>
                        <SelectItem value="Champagne">Champagne</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Burgundy">Burgundy</SelectItem>
                        <SelectItem value="Cream">Cream</SelectItem>
                        <SelectItem value="Charcoal">Charcoal</SelectItem>
                        <SelectItem value="Copper">Copper</SelectItem>
                        <SelectItem value="Navy">Navy</SelectItem>
                        <SelectItem value="Maroon">Maroon</SelectItem>
                        <SelectItem value="Tan">Tan</SelectItem>
                        <SelectItem value="Turquoise">Turquoise</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Condition<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Location<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cyprusTowns.map((town) => (
                          <SelectItem key={town} value={town}>{town}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Transmission<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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
                    <FormLabel className="flex items-center">
                      Fuel Type<span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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
            </div>
          </div>
        );
      
      case "photos":
        return (
          <div className="space-y-6">
            <div>
              <FormLabel className="flex items-center">
                Car Images<span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormDescription>
                Upload clear photos of your car (maximum 5 images). At least one image is required. The first image will be the main photo shown in listings.
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
              {images.length < 5 && (
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
              <p className="text-sm text-red-600 font-medium">
                At least one image is required to create a listing.
              </p>
            )}
          </div>
        );
      
      case "description":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Description<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your car, its features, history, and any other relevant details" 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Adding a detailed description will help buyers understand what makes your car special.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
    }
  };
  
  // Define step titles
  const stepTitles: Record<FormStep, string> = {
    basic: "Basic Information",
    details: "Car Details",
    photos: "Add Photos",
    description: "Description & Submit"
  };
  
  const canProceed = validateCurrentStep();
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <h2 className="text-2xl font-bold">
            {stepTitles[currentStep]}
          </h2>
          <span className="text-gray-500">
            Step {Object.keys(stepTitles).indexOf(currentStep) + 1} of {Object.keys(stepTitles).length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderStepContent()}
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === "basic" || createCarMutation.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep === "description" ? (
              <Button
                type="submit"
                disabled={!canProceed || createCarMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createCarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createCarMutation.isPending ? "Creating Listing..." : "Create Listing"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canProceed || createCarMutation.isPending}
                onClick={handleNextClick}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}