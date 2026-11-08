import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateCard } from "@entities/TemplateCard";
import { CardsRow, EmptyCatalog } from "./CatalogPage.style";
import { CatalogService } from "@app/api/CatalogService";
import { TemplateCardProps } from "@entities/TemplateCard/types";
import { usePagination } from "./hooks/usePagination";
import { PageLoader } from "@shared/ui/PageLoader";
import { Pagination } from "@shared/ui/Pagination";
import { Title } from "@shared/ui/Title/Title";
import { Text } from "@shared/ui/Text/Text";
import {
  ContentWrapper,
  PageWrapper,
  TitleWrapper,
} from "@shared/ui/PageWrapper";

const PAGE_SIZE = 10;

const CatalogPage = () => {
  const { page, nextPage, prevPage, setPage } = usePagination(1);
  const [templates, setTemplates] = useState<TemplateCardProps[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const data = await CatalogService.getTemplates(currentPage, PAGE_SIZE);
      setTemplates(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      if (data.totalPages > 0 && currentPage > data.totalPages) {
        setPage(data.totalPages);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [setPage]);

  useEffect(() => {
    loadTemplates(page);
  }, [page, loadTemplates]);

  const cards = useMemo(
    () => templates.map((tpl) => <TemplateCard key={tpl.id} {...tpl} />),
    [templates]
  );

  const showPagination = totalPages > 1;

  return (
    <PageWrapper>
      <TitleWrapper>
        <Title as="h1" dimension="xxl" color="primary" weight="semibold">
          Каталог
        </Title>
      </TitleWrapper>
      <ContentWrapper>
        {loading ? (
          <PageLoader />
        ) : total === 0 ? (
          <EmptyCatalog>
            <Title as="h2" dimension="l" weight="semibold" color="primary">
              В каталоге пока нет шаблонов
            </Title>
            <Text dimension="m" color="secondary">
              Добавьте первого бота на странице «Внедрение» — он появится здесь
              для всех пользователей.
            </Text>
          </EmptyCatalog>
        ) : (
          <>
            <CardsRow>{cards}</CardsRow>
            {showPagination && (
              <Pagination
                page={page}
                nextPage={nextPage}
                prevPage={prevPage}
                hasNext={page < totalPages}
                hasPrev={page > 1}
              />
            )}
          </>
        )}
      </ContentWrapper>
    </PageWrapper>
  );
};

export default CatalogPage;
