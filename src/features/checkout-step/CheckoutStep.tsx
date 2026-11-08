import React, { useEffect, useState } from "react";
import { useCart } from "@app/providers/CartProvider";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { CatalogService, BotDetails } from "@app/api/CatalogService";
import { PageLoader } from "@shared/ui/PageLoader";
import { TextField } from "@shared/ui/TextField/TextField";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import CartProductCard from "@shared/ui/CartProductCard/CartProductCard";
import { Text } from "@shared/ui/Text/Text";
import { Title } from "@shared/ui/Title/Title";
import {
  CheckoutContainer,
  LeftPanel,
  RightPanel,
  FormSection,
  FormRow,
  FullWidthField,
  HalfWidthField,
  OrderSummaryContainer,
  SummaryRow,
  SummaryLabel,
  SummaryValue,
  TotalRow,
  EditButtonContainer,
  CartItemsContainer,
  CheckoutButtonWrapper,
} from "./CheckoutStep.style";

interface CheckoutStepProps {
  onNextStep: () => void;
  onPrevStep: () => void;
}

const CheckoutStep = ({ onNextStep, onPrevStep }: CheckoutStepProps) => {
  const { items, totalPrice, totalDiscount, totalOldPrice } = useCart();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<
    (BotDetails & { quantity: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.name || "",
    lastName: "",
    organization: "",
    address: "",
    chatbotLink: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      email: prev.email || user.email || "",
      firstName: prev.firstName || user.name || "",
    }));
  }, [user]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <PageLoader />;

  return (
    <CheckoutContainer>
      <LeftPanel>
        <Title as="h2" dimension="l" weight="medium" color="white">
          Контакты
        </Title>
        <FormSection>
          <FormRow>
            <FullWidthField>
              <TextField
                mode="dark"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
              />
            </FullWidthField>
          </FormRow>
          <FormRow>
            <HalfWidthField>
              <TextField
                mode="dark"
                label="Имя"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Имя"
              />
            </HalfWidthField>
            <HalfWidthField>
              <TextField
                mode="dark"
                label="Фамилия"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Фамилия"
              />
            </HalfWidthField>
          </FormRow>
          <FormRow>
            <FullWidthField>
              <TextField
                mode="dark"
                label="Организация (опционально)"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Организация"
              />
            </FullWidthField>
          </FormRow>
          <FormRow>
            <FullWidthField>
              <TextField
                mode="dark"
                label="Адрес"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Адрес"
              />
            </FullWidthField>
          </FormRow>
          <FormRow>
            <FullWidthField>
              <TextField
                mode="dark"
                label="Ссылка привязки чат бота"
                name="chatbotLink"
                value={formData.chatbotLink}
                onChange={handleChange}
                placeholder="Ссылка привязки чат бота"
              />
            </FullWidthField>
          </FormRow>
        </FormSection>
      </LeftPanel>
      <RightPanel>
        <Title as="h2" dimension="l" weight="medium" color="white">
          {items.length} товара
        </Title>
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
              onQuantityChange={() => {}}
              onRemoveItem={() => {}}
              isEditable={false}
            />
          ))}
        </CartItemsContainer>
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
          {totalDiscount != 0 && (
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
          )}
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
        <CheckoutButtonWrapper>
          <Button
            label="Перейти к оплате"
            appearence={ButtonAppearence.PRIMARY}
            dimension="l"
            onClick={onNextStep}
          />
        </CheckoutButtonWrapper>
      </RightPanel>
    </CheckoutContainer>
  );
};

export default CheckoutStep;
