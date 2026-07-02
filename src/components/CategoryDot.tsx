import { useCategories } from '../context/CategoriesContext';

/** Punto de color que representa la categoría de un alimento. */
export function CategoryDot({ categoryId }: { categoryId: string | null }) {
  const { byId } = useCategories();
  const color = (categoryId && byId[categoryId]?.color) || '#CBD5E1';
  const title = (categoryId && byId[categoryId]?.name) || '';
  return <span className="cat-dot" style={{ backgroundColor: color }} title={title} />;
}
