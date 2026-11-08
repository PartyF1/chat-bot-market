import React, { useState } from "react";
import { useBot } from "@app/providers/BotProvider";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { CatalogService } from "@app/api/CatalogService";
import { useNotification } from "@app/providers/NotificationProvider";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import { TextField } from "@shared/ui/TextField/TextField";
import { Text } from "@shared/ui/Text/Text";
import { Title } from "@shared/ui/Title/Title";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CloseButton,
  SelectContainer,
  SelectLabel,
  SelectWrapper,
  CheckboxItem,
  CheckboxLabel,
  TextAreaContainer,
  TextAreaLabel,
  TextAreaField,
} from "./AddBotModal.styled";
import { useRef } from "react";

interface AddBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Доступные интеграции
const AVAILABLE_INTEGRATIONS = [
  { id: "vk", label: "VK" },
  { id: "telegram", label: "Telegram" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "crm", label: "CRM" },
  { id: "mailchimp", label: "Mailchimp" },
  { id: "whatsapp", label: "WhatsApp" },
];

const initialForm = {
  name: "",
  description: "",
  features: "",
  usage: "",
  integrations: [] as string[],
  price: "",
  oldPrice: "",
  advantages: "",
  tech: "",
  image: null as File | null,
  sourceArchive: null as File | null,
};

export const AddBotModal: React.FC<AddBotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addBot } = useBot();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [form, setForm] = useState<typeof initialForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleIntegrationToggle = (integrationId: string) => {
    setForm((prev) => ({
      ...prev,
      integrations: prev.integrations.includes(integrationId)
        ? prev.integrations.filter((id) => id !== integrationId)
        : [...prev.integrations, integrationId],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file && ["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      handleChange("image", file);
    } else {
      showNotification("Можно загрузить только jpg и png", "error");
      handleChange("image", null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSourceArchiveChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files && e.target.files[0];
    if (
      file &&
      [
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
        "application/x-7zip",
        "application/octet-stream",
        ".zip",
        ".rar",
        ".7z",
      ].some(
        (typeOrExt) =>
          file.type.includes(typeOrExt) || file.name.endsWith(typeOrExt)
      )
    ) {
      setForm((prev) => ({ ...prev, sourceArchive: file }));
    } else {
      showNotification("Допустимы только архивы zip, rar, 7z", "error");
      setForm((prev) => ({ ...prev, sourceArchive: null }));
    }
  };

  const resetForm = () => setForm(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!user) {
      showNotification("Необходимо авторизоваться", "error");
      return;
    }
    setIsLoading(true);
    try {
      const botDetails = await CatalogService.createBot({
        name: form.name.trim(),
        title: form.name.trim(),
        description: form.description.trim(),
        features: form.features.trim(),
        usage: form.usage.trim(),
        integrations: form.integrations,
        price: form.price ? parseFloat(form.price) : 0,
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : undefined,
        ownerId: user.id,
        isActive: true,
        advantages: form.advantages.trim(),
        tech: form.tech.trim(),
      });

      if (form.image) {
        await CatalogService.uploadBotImage(botDetails.id, form.image);
      }
      if (form.sourceArchive) {
        await CatalogService.uploadBotArchive(botDetails.id, form.sourceArchive);
      }

      const saved = await CatalogService.getBotById(botDetails.id);

      addBot({
        name: form.name.trim(),
        description: form.description.trim(),
        features: form.features.trim(),
        usage: form.usage.trim(),
        integrations: form.integrations,
        price: form.price ? parseFloat(form.price) : 0,
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : undefined,
        isActive: true,
        ownerId: user.id,
        imageUrl: saved.image,
      });
      showNotification("Бот успешно добавлен в систему", "success");
      resetForm();
      onClose();
    } catch (error: any) {
      showNotification(error.message || "Ошибка при добавлении бота", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <ModalHeader>
          <Title as="h2" dimension="l" weight="semibold">
            Добавить бота
          </Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <TextField
              label="Название бота"
              placeholder="Введите название бота"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={isLoading}
              required
            />
            <TextField
              label="Описание"
              placeholder="Краткое описание бота"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isLoading}
            />
            <TextAreaContainer>
              <TextAreaLabel>Функции</TextAreaLabel>
              <TextAreaField
                placeholder="Опишите функции бота"
                value={form.features}
                onChange={(e) => handleChange("features", e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </TextAreaContainer>
            <TextField
              label="Категории применения"
              placeholder="Например: Агентства, стартапы, компании"
              value={form.usage}
              onChange={(e) => handleChange("usage", e.target.value)}
              disabled={isLoading}
            />
            <TextField
              label="Преимущества"
              placeholder="Укажите преимущества бота"
              value={form.advantages}
              onChange={(e) => handleChange("advantages", e.target.value)}
              disabled={isLoading}
            />
            <TextField
              label="Технические характеристики"
              placeholder="Технические характеристики бота"
              value={form.tech}
              onChange={(e) => handleChange("tech", e.target.value)}
              disabled={isLoading}
            />
            <SelectContainer>
              <SelectLabel>Интеграции</SelectLabel>
              <SelectWrapper>
                {AVAILABLE_INTEGRATIONS.map((integration) => (
                  <CheckboxItem key={integration.id}>
                    <input
                      type="checkbox"
                      id={`integration-${integration.id}`}
                      checked={form.integrations.includes(integration.id)}
                      onChange={() => handleIntegrationToggle(integration.id)}
                      disabled={isLoading}
                    />
                    <CheckboxLabel htmlFor={`integration-${integration.id}`}>
                      {integration.label}
                    </CheckboxLabel>
                  </CheckboxItem>
                ))}
              </SelectWrapper>
            </SelectContainer>
            <TextField
              label="Цена со скидкой (₽)"
              placeholder="Цена для клиента со скидкой"
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              disabled={isLoading}
            />
            <TextField
              label="Старая цена (₽)"
              placeholder="Обычная цена без скидки"
              type="number"
              value={form.oldPrice}
              onChange={(e) => handleChange("oldPrice", e.target.value)}
              disabled={isLoading}
            />
            <div style={{ margin: "16px 0 12px" }}>
              <label style={{ fontWeight: 500 }}>Изображение (jpg/png):</label>
              <input
                type="file"
                accept="image/jpeg, image/jpg, image/png"
                ref={fileInputRef}
                style={{ marginLeft: 12 }}
                onChange={handleImageChange}
                disabled={isLoading}
              />
              {form.image && (
                <div style={{ marginTop: 8 }}>
                  <Text dimension="s">Выбран файл: {form.image.name}</Text>
                </div>
              )}
            </div>
            <div style={{ margin: "16px 0 12px" }}>
              <label style={{ fontWeight: 500 }}>
                Архив с исходниками (zip, rar, 7z):
              </label>
              <input
                type="file"
                accept=".zip,.rar,.7z,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed"
                onChange={handleSourceArchiveChange}
                disabled={isLoading}
              />
              {form.sourceArchive && (
                <div style={{ marginTop: 8 }}>
                  <Text dimension="s">
                    Выбран архив: {form.sourceArchive.name}
                  </Text>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              label="Отмена"
              appearence={ButtonAppearence.GHOST}
              dimension="m"
              onClick={onClose}
              disabled={isLoading}
            />
            <Button
              label="Добавить"
              appearence={ButtonAppearence.PRIMARY}
              dimension="m"
              onClick={handleSubmit}
              disabled={isLoading || !form.name.trim()}
            />
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
