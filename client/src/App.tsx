import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import BrowseCars from "@/pages/browse-cars";
import CarDetail from "@/pages/car-detail";
import SellCar from "@/pages/sell-car";
import UserProfile from "@/pages/user-profile";
import HowItWorksPage from "@/pages/how-it-works-page";
import Payment from "@/pages/payment";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/browse" component={BrowseCars} />
      <Route path="/cars/:id" component={CarDetail} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <ProtectedRoute path="/sell" component={SellCar} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      <ProtectedRoute path="/payment" component={Payment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
