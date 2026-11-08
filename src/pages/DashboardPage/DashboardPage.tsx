import React, { useState, useEffect } from "react";
import {
  PageWrapper,
  ContentWrapper,
  TitleWrapper,
} from "@shared/ui/PageWrapper";
import { Title } from "@shared/ui/Title/Title";
import { TextField } from "@shared/ui/TextField/TextField";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { ordersApi } from "@app/api/orders";
import { Order } from "@app/types/order";
import { PageLoader } from "@shared/ui/PageLoader";
import {
  DashboardContainer,
  Section,
  SectionTitle,
  ProfileForm,
  FormRow,
  OrdersList,
  OrderCard,
  OrderHeader,
  OrderItems,
  OrderItem,
  OrderStatus,
  EmptyState,
} from "./DashboardPage.styled";
import { botArchiveDownloadUrl } from "@shared/config/apiUrl";
import { CatalogService } from "@app/api/CatalogService";
import { useNavigate } from "react-router-dom";

function downloadArchive(botId: string) {
  const link = document.createElement("a");
  link.href = botArchiveDownloadUrl(botId);
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const DashboardPage = React.memo(function DashboardPage() {
  const { user, updateProfile, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveByBotId, setArchiveByBotId] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userOrders = await ordersApi.getOrdersByUserId(user.id);
        setOrders(Array.isArray(userOrders) ? userOrders : []);
      } catch (e: any) {
        console.error("Error loading orders:", e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  useEffect(() => {
    const ids = new Set<string>();
    orders.forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        ids.add(item.bot.id);
      });
    });
    if (ids.size === 0) {
      setArchiveByBotId({});
      return;
    }
    void (async () => {
      const entries = await Promise.all(
        [...ids].map(async (id) => {
          try {
            const bot = await CatalogService.getBotById(id);
            return [id, Boolean(bot.archiveUrl)] as const;
          } catch {
            return [id, false] as const;
          }
        })
      );
      setArchiveByBotId(Object.fromEntries(entries));
    })();
  }, [orders]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения данных");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/auth", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "В обработке";
      case "completed":
        return "Завершён";
      case "cancelled":
        return "Отменён";
      default:
        return status;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#666";
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <PageWrapper>
        <ContentWrapper>
          <EmptyState>
            Сессия недействительна. Войдите снова.
          </EmptyState>
          <FormRow>
            <Button
              label="На страницу входа"
              appearence={ButtonAppearence.PRIMARY}
              dimension="m"
              onClick={() => navigate("/auth", { replace: true })}
            />
          </FormRow>
        </ContentWrapper>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ContentWrapper>
        <TitleWrapper>
          <Title as="h1" dimension="xxl" color="primary" weight="semibold">
            Личный кабинет
          </Title>
        </TitleWrapper>

        <DashboardContainer>
          <Section>
            <SectionTitle>Персональные данные</SectionTitle>
            <ProfileForm>
              <FormRow>
                <TextField
                  label="Имя"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Введите имя"
                />
              </FormRow>
              <FormRow>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Введите email"
                />
              </FormRow>
              {error && <div style={{ color: "#F44336" }}>{error}</div>}
              {isEditing ? (
                <FormRow>
                  <Button
                    label="Сохранить"
                    appearence={ButtonAppearence.PRIMARY}
                    dimension="m"
                    onClick={handleSave}
                    disabled={saving}
                  />
                  <Button
                    label="Отмена"
                    appearence={ButtonAppearence.GHOST}
                    dimension="m"
                    onClick={handleCancel}
                    disabled={saving}
                  />
                </FormRow>
              ) : (
                <FormRow>
                  <Button
                    label="Редактировать"
                    appearence={ButtonAppearence.PRIMARY}
                    dimension="m"
                    onClick={() => setIsEditing(true)}
                  />
                  <Button
                    label="Выйти"
                    appearence={ButtonAppearence.GHOST}
                    dimension="m"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  />
                </FormRow>
              )}
            </ProfileForm>
          </Section>

          <Section>
            <SectionTitle>История заказов</SectionTitle>
            {orders.length === 0 ? (
              <EmptyState>У вас пока нет заказов</EmptyState>
            ) : (
              <OrdersList>
                {orders.map((order) => (
                  <OrderCard key={order.id}>
                    <OrderHeader>
                      <div>
                        <strong>Заказ №{order.id}</strong>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#666",
                            marginTop: "4px",
                          }}
                        >
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <OrderStatus color={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </OrderStatus>
                    </OrderHeader>
                    <OrderItems>
                      {(Array.isArray(order.items) ? order.items : []).map(
                        (item, index) => (
                        <OrderItem key={index}>
                          <div>
                            <strong>{item.bot.name}</strong>
                            <div style={{ fontSize: "14px", color: "#666" }}>
                              Количество: {item.quantity}
                            </div>
                          </div>
                          <div>
                            <strong>{item.price * item.quantity} ₽</strong>
                          </div>
                          {/* Кнопка скачивания */}
                          <div>
                            <Button
                              dimension="s"
                              appearence={ButtonAppearence.GHOST}
                              label="Скачать архив"
                              onClick={() => downloadArchive(item.bot.id)}
                              disabled={!archiveByBotId[item.bot.id]}
                            />
                          </div>
                        </OrderItem>
                      )
                      )}
                    </OrderItems>
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid #e0e0e0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        {order.totalOldPrice &&
                          order.totalOldPrice > order.totalPrice && (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#666",
                                textDecoration: "line-through",
                              }}
                            >
                              {order.totalOldPrice} ₽
                            </div>
                          )}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                        Итого: {order.totalPrice} ₽
                      </div>
                    </div>
                  </OrderCard>
                ))}
              </OrdersList>
            )}
          </Section>
        </DashboardContainer>
      </ContentWrapper>
    </PageWrapper>
  );
});

export default DashboardPage;
