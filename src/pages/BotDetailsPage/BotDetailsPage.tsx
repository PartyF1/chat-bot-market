import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { CatalogService, BotDetails } from "@app/api/CatalogService";
import { PageLoader } from "@shared/ui/PageLoader";
import { Breadcrumbs } from "@shared/ui/Breadcrumbs";
import { useCart } from "@app/providers/CartProvider";
import { useNotification } from "@app/providers/NotificationProvider";
import {
  Container,
  Title,
  ImageBlock,
  Image,
  InfoBlock,
  PriceBlock,
  Price,
  OldPrice,
  RatingBlock,
  DetailsGrid,
  DetailsCol,
  DetailsLabel,
  DetailsValue,
} from "./BotDetailsPage.style";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";

const BotDetailsPage = React.memo(() => {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<BotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    CatalogService.getBotById(id)
      .then((data) => {
        setBot(data);
      })
      .catch((error) => {
        console.error("Error loading bot:", error);
        setBot(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (bot) {
      // Преобразуем BotDetails в Bot для корзины
      addToCart({
        id: bot.id,
        name: bot.name,
        description: bot.description,
        price: bot.price,
        oldPrice: bot.oldPrice,
        imageUrl: bot.image,
        createdAt: new Date(bot.createdAt),
        isActive: bot.isActive,
        ownerId: bot.ownerId,
        features: bot.features,
        integrations: bot.integrations,
        usage: bot.usage,
      });
      showNotification("Бот успешно добавлен в корзину", "success");
    }
  };

  const details = useMemo(
    () =>
      bot && [
        [
          { label: "Цель:", value: bot.description },
          { label: "Преимущества:", value: bot.advantages },
        ],
        [
          { label: "Функции:", value: bot.features },
          { label: "Технические характеристики:", value: bot.tech },
        ],
        [
          { label: "Интеграции:", value: bot.integrations },
          { label: "Применение:", value: bot.usage },
        ],
      ],
    [bot]
  );

  if (loading || !bot) return <PageLoader />;

  return (
    <Container>
      <Breadcrumbs
        items={[{ label: "Каталог", to: "/catalog" }, { label: bot.title }]}
      />
      <Title>{bot.title}</Title>
      <InfoBlock>
        <ImageBlock>
          <Image src={bot.image} alt={bot.title} />
        </ImageBlock>
        <PriceBlock>
          <RatingBlock>
            <span style={{ fontSize: 22, marginRight: 8 }}>★</span>
            <span style={{ fontSize: 18 }}>{bot.rating}</span>
          </RatingBlock>
          <Price>{bot.price.toLocaleString()} ₽</Price>
          {bot.oldPrice && (
            <OldPrice>{bot.oldPrice.toLocaleString()} ₽</OldPrice>
          )}
          <Button
            onClick={handleAddToCart}
            label="В корзину"
            appearence={ButtonAppearence.PRIMARY}
            dimension="l"
          />
        </PriceBlock>
      </InfoBlock>
      <DetailsGrid>
        {details?.map((col, i) => (
          <DetailsCol key={i}>
            {col.map((row, j) => (
              <div key={j}>
                <DetailsLabel>{row.label}</DetailsLabel>
                <DetailsValue>{row.value}</DetailsValue>
              </div>
            ))}
          </DetailsCol>
        ))}
      </DetailsGrid>
    </Container>
  );
});

export default BotDetailsPage;
