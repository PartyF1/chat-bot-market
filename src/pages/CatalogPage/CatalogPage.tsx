import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateCard } from "@entities/TemplateCard";
import { CatalogContainer, CardsRow } from "./CatalogPage.style";
import { CatalogService } from "@app/api/CatalogService";
import { TemplateCardProps } from "@entities/TemplateCard/types";
import { usePagination } from "./hooks/usePagination";
import { PageLoader } from "@shared/ui/PageLoader";
import { Pagination } from "@shared/ui/Pagination";
import { Title } from "@shared/ui/Title/Title";
import {
  ContentWrapper,
  PageWrapper,
  TitleWrapper,
} from "@shared/ui/PageWrapper";

const PAGE_SIZE = 10;

const CatalogPage = () => {
  const { page, nextPage, prevPage } = usePagination(1);
  const [templates, setTemplates] = useState<TemplateCardProps[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async (page: number) => {
    setLoading(true);
    const data = await CatalogService.getTemplates(page, PAGE_SIZE);
    setTemplates(data.content);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates(page);
  }, [page, loadTemplates]);

  const cards = useMemo(
    () => templates.map((tpl, idx) => <TemplateCard key={idx} {...tpl} />),
    [templates]
  );

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
        ) : (
          <>
            <CardsRow>{cards}</CardsRow>
            <Pagination page={page} nextPage={nextPage} prevPage={prevPage} />
          </>
        )}
      </ContentWrapper>
    </PageWrapper>
  );
};

export default CatalogPage;
