import styled from "styled-components";

export const CatalogContainer = styled.div`
  padding: 0 40px;
`;

export const CardsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

export const EmptyCatalog = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 80px 24px;
  text-align: center;
`;
