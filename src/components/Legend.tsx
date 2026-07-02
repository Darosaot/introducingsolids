import { useCategories } from '../context/CategoriesContext';
import { t } from '../lib/i18n';

/** Leyenda con el color de cada categoría de alimentos. */
export function Legend() {
  const { categories } = useCategories();
  if (categories.length === 0) return null;
  return (
    <div className="legend" aria-label={t.categories.legend}>
      {categories.map((c) => (
        <span className="legend-item" key={c.id}>
          <span className="cat-dot" style={{ backgroundColor: c.color }} />
          {c.name}
        </span>
      ))}
    </div>
  );
}
