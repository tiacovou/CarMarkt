import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ArrowLeft, ArrowRight, Check, Camera } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

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
  "Audi", "Volkswagen", "Hyundai", "Kia", "Subaru", "Lexus", "Jeep", "Tesla",
  "Mazda", "Mitsubishi", "Peugeot", "Citroen", "Renault", "Fiat", "Alfa Romeo"
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
type FormStep = "basic" | "details" | "photos" | "description" | "review";

// Define a type to track completion status of each step
interface StepStatus {
  basic: boolean;
  details: boolean;
  photos: boolean;
  description: boolean;
  review: boolean;
}

export default function MultiStepCarForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track completion status of each step
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    basic: false,
    details: false,
    photos: false,
    description: true, // Optional step, so default to true
    review: false
  });
  
  // Calculate progress percentage based on completed steps
  const calculateProgress = (): number => {
    const totalSteps = Object.keys(stepStatus).length;
    const completedSteps = Object.values(stepStatus).filter(Boolean).length;
    return (completedSteps / totalSteps) * 100;
  };
  
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
    },
    mode: "onChange"
  });
  
  // Watch form values to update step completion status
  const watchedValues = form.watch();
  
  useEffect(() => {
    // Check if basic info is complete
    const basicComplete = 
      !!watchedValues.make && 
      !!watchedValues.model && 
      !!watchedValues.year &&
      !!watchedValues.price;
    
    // Check if details are complete  
    const detailsComplete = 
      !!watchedValues.mileage && 
      !!watchedValues.color && 
      !!watchedValues.condition &&
      !!watchedValues.location;
    
    // Photos are complete if at least one image is uploaded
    const photosComplete = images.length > 0;
    
    // Description is optional, so it's always considered complete
    
    // Update step status
    setStepStatus(prev => ({
      ...prev,
      basic: basicComplete,
      details: detailsComplete,
      photos: photosComplete
    }));
  }, [watchedValues, images]);
  
  // Create car mutation
  const createCarMutation = useMutation({
    mutationFn: async (values: z.infer<typeof carFormSchema>) => {
      // Double-check that images exist before making the API call
      if (images.length === 0) {
        throw new Error("At least one image is required");
      }
      
      const res = await apiRequest("POST", "/api/cars", values);
      return await res.json();
    },
    onSuccess: async (car) => {
      setIsSubmitting(true);
      // Upload images
      await uploadImages(car.id);
    },
    onError: (error) => {
      toast({
        title: "Error creating listing",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
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
    
    setIsSubmitting(false);
    
    // Navigate to the new car page
    navigate(`/cars/${carId}`);
  };
  
  const nextStep = () => {
    const steps: FormStep[] = ["basic", "details", "photos", "description", "review"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      window.scrollTo(0, 0); // Scroll to top when changing steps
    }
  };
  
  const prevStep = () => {
    const steps: FormStep[] = ["basic", "details", "photos", "description", "review"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo(0, 0); // Scroll to top when changing steps
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
               !!form.getValues("color") &&
               !!form.getValues("location");
      case "photos":
        return images.length > 0;
      case "description":
        // Description is optional, so always valid
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };
  
  const canProceed = validateCurrentStep();
  
  const onSubmit = (values: z.infer<typeof carFormSchema>) => {
    // If on the review step, submit the form
    if (currentStep === "review") {
      // Check if at least one image is uploaded
      if (images.length === 0) {
        toast({
          title: "Image required",
          description: "At least one image is required for your car listing.",
          variant: "destructive",
        });
        setCurrentStep("photos");
        return;
      }
      
      createCarMutation.mutate(values);
    } else {
      // Otherwise, go to the next step
      nextStep();
    }
  };
  
  // Function to render the current step's form fields
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
                    <FormLabel>Make</FormLabel>
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
                    <FormLabel>Price (€)</FormLabel>
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
                    <FormLabel>Mileage (km)</FormLabel>
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nicosia, Limassol" {...field} />
                    </FormControl>
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
                    <FormLabel>Transmission (Optional)</FormLabel>
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
                    <FormLabel>Fuel Type (Optional)</FormLabel>
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
              <FormLabel>Car Images (Required)</FormLabel>
              <FormDescription>
                Upload clear photos of your car. At least one image is required. The first image will be the main photo shown in listings.
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
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your car, its features, history, and any other relevant details" 
                      className="h-64"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Adding a detailed description will help buyers understand what makes your car special. Include information about service history, features, and condition.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      
      case "review":
        const formValues = form.getValues();
        return (
          <div className="space-y-6">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Review your listing</AlertTitle>
              <AlertDescription>
                Please review all the information below before creating your listing.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Basic Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Make:</dt>
                      <dd className="font-medium">{formValues.make}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Model:</dt>
                      <dd className="font-medium">{formValues.model}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Year:</dt>
                      <dd className="font-medium">{formValues.year}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Price:</dt>
                      <dd className="font-medium">€{formValues.price}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Car Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Mileage:</dt>
                      <dd className="font-medium">{formValues.mileage} km</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Color:</dt>
                      <dd className="font-medium">{formValues.color}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Condition:</dt>
                      <dd className="font-medium capitalize">{formValues.condition}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Location:</dt>
                      <dd className="font-medium">{formValues.location}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
                <dl className="space-y-2">
                  {formValues.transmission && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Transmission:</dt>
                      <dd className="font-medium">{formValues.transmission}</dd>
                    </div>
                  )}
                  {formValues.fuelType && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Fuel Type:</dt>
                      <dd className="font-medium">{formValues.fuelType}</dd>
                    </div>
                  )}
                  <div className="pt-2">
                    <dt className="text-gray-500 mb-1">Description:</dt>
                    <dd className="font-medium whitespace-pre-wrap">
                      {formValues.description || "No description provided."}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Images ({images.length})</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded overflow-hidden">
                      <img 
                        src={image.preview} 
                        alt={`Car image ${index + 1}`} 
                        className="object-cover w-full h-full"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-white text-xs py-0.5 px-2 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };
  
  // Define step titles
  const stepTitles: Record<FormStep, string> = {
    basic: "Basic Information",
    details: "Car Details",
    photos: "Add Photos",
    description: "Description",
    review: "Review & Submit"
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <h2 className="text-2xl font-bold">
            {stepTitles[currentStep]}
          </h2>
          <span className="text-gray-500">Step {Object.keys(stepTitles).indexOf(currentStep) + 1} of {Object.keys(stepTitles).length}</span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {Object.entries(stepTitles).map(([step, title], index) => (
            <button 
              key={step}
              onClick={() => {
                // Allow jumping to previous completed steps
                if (Object.keys(stepTitles).indexOf(step as FormStep) <= 
                    Object.keys(stepTitles).indexOf(currentStep)) {
                  setCurrentStep(step as FormStep);
                }
              }}
              className={`flex flex-col items-center w-1/5 ${currentStep === step ? 'text-primary font-medium' : ''}`}
            >
              <div className={`w-4 h-4 rounded-full mb-1 ${
                stepStatus[step as keyof StepStatus] 
                  ? 'bg-primary' 
                  : currentStep === step 
                    ? 'border-2 border-primary' 
                    : 'bg-gray-200'
              }`}>
                {stepStatus[step as keyof StepStatus] && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="hidden md:block">{title}</span>
            </button>
          ))}
        </div>
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
              disabled={currentStep === "basic" || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button
              type="submit"
              disabled={!canProceed || isSubmitting}
              className={currentStep === "review" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep === "review" ? (
                isSubmitting ? "Creating Listing..." : "Create Listing"
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}