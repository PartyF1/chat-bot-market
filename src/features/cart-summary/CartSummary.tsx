import React, { useEffect, useState } from "react";
import { useCart } from "@app/providers/CartProvider";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { useNotification } from "@app/providers/NotificationProvider";
import { CatalogService, BotDetails } from "@app/api/CatalogService";
import { PageLoader } from "@shared/ui/PageLoader";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import CartProductCard from "@shared/ui/CartProductCard/CartProductCard";
import { useNavigate } from "react-router-dom";
import { Text } from "@shared/ui/Text/Text";
import { Title } from "@shared/ui/Title/Title";

import {
  PageContainer,
  LeftPanel,
  RightPanel,
  CartItemsContainer,
  OrderSummaryContainer,
  SummaryRow,
  SummaryLabel,
  SummaryValue,
  TotalRow,
  EmptyCartContainer,
  EmptyCartButtonWrapper,
} from "./CartSummary.style";

interface CartSummaryProps {
  onNextStep: () => void;
}

const CartSummary = ({ onNextStep }: CartSummaryProps) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalDiscount,
    totalOldPrice,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<
    (BotDetails & { quantity: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      showNotification(
        "Войдите или зарегистрируйтесь, чтобы оформить заказ",
        "error"
      );
      navigate("/auth", {
        state: { from: { pathname: "/cart", step: "checkout" } },
      });
      return;
    }
    onNextStep();
  };

  useEffect(() => {
    const loadCartItems = async () => {
      setLoading(true);
      try {
        const itemsData = await Promise.all(
          items.map(async (item) => {
            const botDetails = await CatalogService.getBotById(item.bot.id);
            return { ...botDetails, quantity: item.quantity };
          })
        );
        setCartItems(itemsData);
      } catch (error) {
        console.error("Error loading cart items:", error);
      }
      setLoading(false);
    };

    loadCartItems();
  }, [items]);

  const handleQuantityChange = (botId: string, newQuantity: number) => {
    updateQuantity(botId, newQuantity);
  };

  const handleRemoveItem = (botId: string) => {
    removeFromCart(botId);
  };

  const handleToCatalog = () => {
    navigate("/catalog");
  };

  if (loading) return <PageLoader />;

  return (
    <PageContainer>
      {cartItems.length === 0 ? (
        <EmptyCartContainer>
          <Title as="h2" dimension="xl" weight="semibold" color="white">
            Корзина пуста
          </Title>
          <Text dimension="xl" color="secondary">
            Добавьте товары из каталога
          </Text>
          <EmptyCartButtonWrapper>
            <Button
              label="Перейти в каталог"
              appearence={ButtonAppearence.PRIMARY}
              dimension="l"
              onClick={handleToCatalog}
            />
          </EmptyCartButtonWrapper>
        </EmptyCartContainer>
      ) : (
        <>
          <LeftPanel>
            <CartItemsContainer>
              {cartItems.map((item) => (
                <CartProductCard
                  key={item.id}
                  id={item.id}
                  image={item.image}
                  title={item.title}
                  price={item.price}
                  oldPrice={item.oldPrice}
                  integrations={item.integrations}
                  quantity={item.quantity}
                  onQuantityChange={handleQuantityChange}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </CartItemsContainer>
          </LeftPanel>
          <RightPanel>
            <Title as="h2" dimension="l" weight="medium" color="white">
              {items.length} товара
            </Title>
            <OrderSummaryContainer>
              <SummaryRow>
                <SummaryLabel>
                  <Text dimension="l" color="secondary">
                    стоимость
                  </Text>
                </SummaryLabel>
                <SummaryValue>
                  <Text dimension="l" weight="medium" color="white">
                    {totalOldPrice?.toLocaleString()} ₽
                  </Text>
                </SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>
                  <Text dimension="l" color="secondary">
                    скидка
                  </Text>
                </SummaryLabel>
                <SummaryValue>
                  <Text dimension="l" weight="medium" color="white">
                    {totalDiscount?.toLocaleString()} ₽
                  </Text>
                </SummaryValue>
              </SummaryRow>
              <TotalRow>
                <SummaryLabel>
                  <Text dimension="xl" weight="semibold" color="white">
                    итого
                  </Text>
                </SummaryLabel>
                <SummaryValue>
                  <Text dimension="xl" weight="semibold" color="white">
                    {totalPrice.toLocaleString()} ₽
                  </Text>
                </SummaryValue>
              </TotalRow>
            </OrderSummaryContainer>
            <Button
              label="Перейти к оформлению"
              appearence={ButtonAppearence.PRIMARY}
              dimension="l"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            />
          </RightPanel>
        </>
      )}
    </PageContainer>
  );
};

export default CartSummary;
