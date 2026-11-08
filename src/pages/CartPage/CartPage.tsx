import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CartContent, CartPageContainer } from "./CartPage.style";
import CartSummary from "@features/cart-summary";
import CheckoutStep from "@features/checkout-step";
import PaymentStep from "@features/payment-step";
import { TabBar } from "@features/tab-bar/TabBar";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";

const STEPS = [
  { id: "cart", label: "Корзина" },
  { id: "checkout", label: "Оформление заказа" },
  { id: "payment", label: "Оплата" },
];

const CartPage = React.memo(() => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const initialStep =
    (location.state as { step?: string } | null)?.step === "checkout" &&
    isAuthenticated
      ? "checkout"
      : "cart";
  const [currentStep, setCurrentStep] = useState(initialStep);

  useEffect(() => {
    const step = (location.state as { step?: string } | null)?.step;
    if (step === "checkout" && isAuthenticated) {
      setCurrentStep("checkout");
    }
  }, [location.state, isAuthenticated]);

  const handleStepClick = (stepId: string) => {
    if (
      (stepId === "checkout" || stepId === "payment") &&
      !isAuthenticated
    ) {
      return;
    }
    setCurrentStep(stepId);
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case "cart":
        return <CartSummary onNextStep={() => setCurrentStep("checkout")} />;
      case "checkout":
        return (
          <CheckoutStep
            onNextStep={() => setCurrentStep("payment")}
            onPrevStep={() => setCurrentStep("cart")}
          />
        );
      case "payment":
        return <PaymentStep onPrevStep={() => setCurrentStep("checkout")} />;
      default:
        return <CartSummary onNextStep={() => setCurrentStep("checkout")} />;
    }
  };

  return (
    <CartPageContainer>
      <TabBar
        tabs={STEPS}
        activeTab={currentStep}
        onTabChange={handleStepClick}
        fullWidth
        variant="underline"
        size={"m"}
      />
      <CartContent>{renderStepComponent()}</CartContent>
    </CartPageContainer>
  );
});

export default CartPage;
