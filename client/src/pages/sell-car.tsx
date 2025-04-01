import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SimpleMultiStepCarForm from "@/components/car/SimpleMultiStepCarForm";

export default function SellCar() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 text-center">Sell Your Car</h1>
          <p className="text-gray-600 text-center mb-8">
            Create a detailed listing to attract potential buyers
          </p>
          
          <SimpleMultiStepCarForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
