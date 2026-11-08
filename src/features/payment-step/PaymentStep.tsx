import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@app/providers/CartProvider";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { useNotification } from "@app/providers/NotificationProvider";
import { CatalogService, BotDetails } from "@app/api/CatalogService";
import { ordersApi } from "@app/api/orders";
import { PageLoader } from "@shared/ui/PageLoader";
import { TextField } from "@shared/ui/TextField/TextField";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import CartProductCard from "@shared/ui/CartProductCard/CartProductCard";
import { Text } from "@shared/ui/Text/Text";
import { Title } from "@shared/ui/Title/Title";
import {
  PaymentContainer,
  LeftPanel,
  RightPanel,
  PaymentSection,
  PaymentMethodGrid,
  PaymentMethodButton,
  Separator,
  CardForm,
  CardRow,
  CardField,
  ExpiryDateWrapper,
  MonthField,
  YearField,
  RememberDetailsContainer,
  ToggleSwitch,
  CompleteOrderButtonWrapper,
  OrderSummaryContainer,
  SummaryRow,
  SummaryLabel,
  SummaryValue,
  TotalRow,
  EditButtonContainer,
  CartItemsContainer,
} from "./PaymentStep.style";
import { botArchiveDownloadUrl } from "@shared/config/apiUrl";

interface PaymentStepProps {
  onPrevStep: () => void;
}

const PaymentStep = ({ onPrevStep }: PaymentStepProps) => {
  const { items, totalPrice, totalDiscount, totalOldPrice, clearCart } =
    useCart();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<
    (BotDetails & { quantity: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
    rememberDetails: false,
  });

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
    const { name, value, type, checked } = e.target;
    setCardData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCompleteOrder = async () => {
    if (!isAuthenticated || !user) {
      showNotification(
        "Необходимо авторизоваться для завершения покупки",
        "error"
      );
      navigate("/auth", { state: { from: { pathname: "/cart" } } });
      return;
    }

    if (items.length === 0) {
      showNotification("Корзина пуста", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // Преобразуем элементы корзины в формат заказа
      const orderItems = items.map((item) => {
        const cartItem = cartItems.find((ci) => ci.id === item.bot.id);
        return {
          bot: {
            id: item.bot.id,
            name: item.bot.name || cartItem?.title || "Бот",
            description: item.bot.description || cartItem?.description || "",
            price: item.bot.price,
            oldPrice: item.bot.oldPrice,
            createdAt: item.bot.createdAt || new Date(),
            isActive: item.bot.isActive ?? true,
            ownerId: item.bot.ownerId || cartItem?.ownerId || "",
            features: item.bot.features || cartItem?.features || "",
            integrations: item.bot.integrations || cartItem?.integrations || [],
            usage: item.bot.usage || cartItem?.usage || "",
          },
          quantity: item.quantity,
          price: item.bot.price,
        };
      });

      // Создаем заказ со статусом "completed"
      const order = await ordersApi.createOrder(
        user.id,
        orderItems,
        totalPrice,
        totalOldPrice
      );

      // Обновляем статус заказа на "completed"
      await ordersApi.completeOrder(order.id);

      showNotification("Покупка успешно завершена!", "success");

      cartItems.forEach((cartItem) => {
        if (cartItem.archiveUrl) {
          const link = document.createElement("a");
          link.href = botArchiveDownloadUrl(cartItem.id);
          link.target = "_blank";
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });

      clearCart();

      // Перенаправляем на страницу истории покупок
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      showNotification(
        error.message || "Ошибка при завершении покупки",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <PaymentContainer>
      <LeftPanel>
        <Title as="h2" dimension="l" weight="medium" color="white">
          Быстрая оплата
        </Title>
        <PaymentSection>
          <PaymentMethodGrid>
            <PaymentMethodButton onClick={() => console.log("SBP clicked")}>
              СБП
            </PaymentMethodButton>
            <PaymentMethodButton
              onClick={() => console.log("Apple Pay clicked")}
            >
              Apple Pay
            </PaymentMethodButton>
            <PaymentMethodButton onClick={() => console.log("Dolami clicked")}>
              Долями
            </PaymentMethodButton>
            <PaymentMethodButton onClick={() => console.log("PayPal clicked")}>
              PayPal
            </PaymentMethodButton>
          </PaymentMethodGrid>
        </PaymentSection>

        <Separator>
          <Text dimension="l" color="secondary">
            или
          </Text>
        </Separator>

        <Title as="h2" dimension="l" weight="medium" color="white">
          Оплата картой
        </Title>
        <PaymentSection>
          <CardForm>
            <CardField>
              <TextField
                mode="dark"
                label="Пример: 1234 1234 1234 1234"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleChange}
                placeholder="Номер карты"
              />
            </CardField>
            <CardField>
              <TextField
                mode="dark"
                label="Имя на карте"
                name="cardName"
                value={cardData.cardName}
                onChange={handleChange}
                placeholder="Имя на карте"
              />
            </CardField>
            <CardRow>
              <ExpiryDateWrapper>
                <MonthField>
                  <TextField
                    mode="dark"
                    label="Месяц"
                    name="expiryMonth"
                    value={cardData.expiryMonth}
                    onChange={handleChange}
                    placeholder="..."
                  />
                </MonthField>
                <YearField>
                  <TextField
                    mode="dark"
                    label="Год"
                    name="expiryYear"
                    value={cardData.expiryYear}
                    onChange={handleChange}
                    placeholder="..."
                  />
                </YearField>
              </ExpiryDateWrapper>
              <CardField>
                <TextField
                  mode="dark"
                  label="CVC"
                  name="cvc"
                  value={cardData.cvc}
                  onChange={handleChange}
                  placeholder="CVC"
                />
              </CardField>
            </CardRow>
          </CardForm>

          <RememberDetailsContainer>
            <ToggleSwitch>
              <input
                type="checkbox"
                name="rememberDetails"
                checked={cardData.rememberDetails}
                onChange={handleChange}
              />
              <span className="slider round"></span>
            </ToggleSwitch>
            <Text dimension="m">
              Запомнить данные для дальнейшего использования
            </Text>
          </RememberDetailsContainer>
        </PaymentSection>
      </LeftPanel>

      <RightPanel>
        <EditButtonContainer>
          <Button
            label="Редактировать"
            appearence={ButtonAppearence.GHOST}
            dimension="m"
            onClick={onPrevStep}
          />
        </EditButtonContainer>
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
        <CompleteOrderButtonWrapper>
          <Button
            label="Завершить покупку"
            appearence={ButtonAppearence.PRIMARY}
            dimension="l"
            onClick={handleCompleteOrder}
            disabled={isProcessing}
          />
        </CompleteOrderButtonWrapper>
      </RightPanel>
    </PaymentContainer>
  );
};

export default PaymentStep;
