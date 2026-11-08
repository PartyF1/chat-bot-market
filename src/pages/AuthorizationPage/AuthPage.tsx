import React, { useState } from "react";
import { useAuth } from "@app/providers/AuthProvider/AuthProvider";
import { Button } from "@shared/ui/Button/Button";
import { ButtonAppearence } from "@shared/ui/Button/button.types";
import { TextField } from "@shared/ui/TextField/TextField";
import { Text } from "@shared/ui/Text/Text";
import { Title } from "@shared/ui/Title/Title";
import {
  LeftPanel,
  RightPanel,
  Logo,
  Form,
  Footer,
  AuthPageWrapper,
} from "./AuthPage.styled";
import { useNavigate, useLocation } from "react-router-dom";

// TODO: заменить на ваш SVG/лого
const LogoIcon = () => (
  <svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="24" fill="#2563eb" />
    <path d="M24 12L34 36H14L24 12Z" fill="#fff" />
  </svg>
);

export const AuthPage = React.memo(function AuthPage() {
  const { login, register, isLoading, error, isAuthenticated } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from;
      if (from?.pathname) {
        navigate(from.pathname, {
          replace: true,
          state: from.step ? { step: from.step } : undefined,
        });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLocalError("Введите email и пароль");
      return;
    }

    if (isRegister) {
      if (password !== repeatPassword) {
        setLocalError("Пароли не совпадают");
        return;
      }
      if (trimmedPassword.length < 6) {
        setLocalError("Пароль должен быть не короче 6 символов");
        return;
      }
      await register(trimmedEmail, trimmedPassword, name);
    } else {
      await login(trimmedEmail, trimmedPassword);
    }
  };

  return (
    <AuthPageWrapper>
      <LeftPanel>
        <Logo>
          <LogoIcon />
        </Logo>
        <Title as="h2" dimension="xl" weight="semibold" color="dark">
          Добро пожаловать!
        </Title>
        {isRegister ? null : (
          <Text
            dimension="l"
            color="secondary"
            style={{ marginBottom: "24px", textAlign: "center" }}
          >
            Войдите в аккаунт для полного доступа к покупке чат ботов для вашего
            бизнеса
          </Text>
        )}
        <Form onSubmit={handleSubmit}>
          {isRegister && (
            <TextField
              label={undefined}
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          )}
          <TextField
            label={undefined}
            placeholder="Email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoFocus={!isRegister}
          />
          <TextField
            label={undefined}
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {isRegister && (
            <TextField
              label={undefined}
              placeholder="Повторите пароль"
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              disabled={isLoading}
            />
          )}
          {(error || localError) && (
            <Text
              dimension="m"
              color="danger"
              style={{ marginBottom: "8px", textAlign: "center" }}
            >
              {error || localError}
            </Text>
          )}
          <Button
            label={isRegister ? "Зарегистрироваться" : "Войти"}
            appearence={ButtonAppearence.PRIMARY}
            dimension="l"
            disabled={
              isLoading || !email.trim() || !password.trim()
            }
            onClick={handleSubmit}
          />
        </Form>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button
            label={
              isRegister
                ? "Уже есть аккаунт? Войти"
                : "Нет аккаунта? Зарегистрироваться"
            }
            appearence={ButtonAppearence.GHOST}
            dimension="m"
            onClick={() => setIsRegister((r) => !r)}
            disabled={isLoading}
          />
        </div>
        <Footer>
          <Text dimension="s" color="secondary" style={{ lineHeight: "1.4" }}>
            Регистрируясь вы принимаете
            <br />
            Политику конфиденциальности
          </Text>
        </Footer>
      </LeftPanel>
    </AuthPageWrapper>
  );
});

export default AuthPage;
