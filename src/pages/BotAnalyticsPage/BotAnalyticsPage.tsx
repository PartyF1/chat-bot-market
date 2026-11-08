import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBot } from "@app/providers/BotProvider";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { CatalogService } from "@app/api/CatalogService";
import { earningsApi } from "@app/api/earnings";
import { Bot } from "@app/types/bot";
import { PageLoader } from "@shared/ui/PageLoader";
import { Text } from "@shared/ui/Text/Text";
import { Title } from "@shared/ui/Title/Title";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import { PageWrapper, ContentWrapper } from "@shared/ui/PageWrapper";
import {
  Header,
  BackButton,
  MetricsGrid,
  MetricCard,
  MetricValue,
  MetricLabel,
  BotInfo,
} from "./BotAnalyticsPage.styled";

export const BotAnalyticsPage: React.FC = () => {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();
  const { bots } = useBot();
  const { user } = useAuth();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [dailySales, setDailySales] = useState(0);

  useEffect(() => {
    const loadBotData = async () => {
      if (!botId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Сначала проверяем боты из BotProvider
        const botFromProvider = bots.find((b) => b.id === botId);
        if (botFromProvider) {
          setBot(botFromProvider);
        } else {
          // Если не найден в BotProvider, ищем в CatalogService
          try {
            const botFromCatalog = await CatalogService.getBotById(botId);
            // Преобразуем BotDetails в Bot для совместимости
            setBot({
              id: botFromCatalog.id,
              name: botFromCatalog.name,
              description: botFromCatalog.description,
              price: botFromCatalog.price,
              oldPrice: botFromCatalog.oldPrice,
              imageUrl: botFromCatalog.image,
              createdAt: new Date(botFromCatalog.createdAt),
              isActive: botFromCatalog.isActive,
              ownerId: botFromCatalog.ownerId,
              features: botFromCatalog.features,
              integrations: botFromCatalog.integrations,
              usage: botFromCatalog.usage,
            });
          } catch (error) {
            console.error("Error loading bot from catalog:", error);
          }
        }

        // Загружаем статистику заработка, если пользователь авторизован
        if (user) {
          try {
            const earnings = await earningsApi.getSellerEarnings(user.id);
            const botEarnings = earnings.earningsByBot.find(
              (e) => e.botId === botId
            );
            if (botEarnings) {
              setTotalEarnings(botEarnings.earnings);
              // Для дневной статистики используем мок-данные или можно добавить в API
              setDailyEarnings(Math.floor(botEarnings.earnings));
              setDailySales(Math.floor(botEarnings.sales));
            }
          } catch (error) {
            console.error("Error loading earnings:", error);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadBotData();
  }, [botId, bots, user]);

  if (loading) return <PageLoader />;

  if (!bot) {
    return (
      <PageWrapper>
        <ContentWrapper>
          <Title>Бот не найден</Title>
          <Button
            label="Вернуться к внедрению"
            appearence={ButtonAppearence.PRIMARY}
            dimension="m"
            onClick={() => navigate("/implementation")}
          />
        </ContentWrapper>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ContentWrapper>
        <Header>
          <BackButton onClick={() => navigate("/implementation")}>
            ← Назад к внедрению
          </BackButton>
          <BotInfo>
            <Title as="h1" dimension="xl" weight="semibold">
              {bot.name}
            </Title>
            <Text dimension="m" color="secondary">
              {bot.description}
            </Text>
          </BotInfo>
        </Header>

        <MetricsGrid>
          <MetricCard>
            <MetricValue>{totalEarnings.toLocaleString()} ₽</MetricValue>
            <MetricLabel>Заработано за всё время</MetricLabel>
          </MetricCard>

          <MetricCard>
            <MetricValue>{dailyEarnings.toLocaleString()} ₽</MetricValue>
            <MetricLabel>Заработано за день</MetricLabel>
          </MetricCard>

          <MetricCard>
            <MetricValue>{dailySales}</MetricValue>
            <MetricLabel>Продано за день</MetricLabel>
          </MetricCard>
        </MetricsGrid>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default BotAnalyticsPage;
