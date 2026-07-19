import { useMemo, useState } from 'react';
import { useCategories } from '../context/CategoriesContext';
import {
  buildFoodOptions,
  exactFoodOption,
  searchFoodOptions,
  type FoodOption,
} from '../lib/catalog';
import { t } from '../lib/i18n';
import type { FoodTried } from '../lib/types';
import { CategoryDot } from './CategoryDot';

interface Props {
  value: string;
  onChange: (name: string) => void;
  /** Se llama al elegir una opción del desplegable (rellena la categoría, etc.). */
  onPick?: (option: FoodOption) => void;
  /** Historial de alimentos ya probados por la familia. */
  foods: FoodTried[];
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  /** Muestra debajo si el alimento se marcará como nuevo o ya está probado. */
  showStatus?: boolean;
}

/**
 * Buscador de alimentos: combina el catálogo base con el historial de la
 * familia. Elegir del catálogo es la vía principal; escribir un nombre libre
 * sigue funcionando (entrada manual) y queda guardado para la próxima vez.
 */
export function FoodPicker({
  value,
  onChange,
  onPick,
  foods,
  placeholder,
  ariaLabel,
  autoFocus,
  inputRef,
  showStatus = true,
}: Props) {
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const options = useMemo(() => buildFoodOptions(foods, categories), [foods, categories]);
  const results = useMemo(() => searchFoodOptions(options, value), [options, value]);
  const exact = useMemo(() => exactFoodOption(options, value), [options, value]);
  const trimmed = value.trim();

  function pick(option: FoodOption) {
    onChange(option.name);
    onPick?.(option);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      if (results.length === 0) return;
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActive((prev) => (prev + delta + results.length) % results.length);
      return;
    }
    if (e.key === 'Enter' && open && active >= 0 && results[active]) {
      e.preventDefault();
      pick(results[active]);
    }
  }

  const showList = open && (results.length > 0 || trimmed !== '');

  return (
    <div className="food-picker">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t.catalog.searchPlaceholder}
        aria-label={ariaLabel ?? t.meals.foodName}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={120}
      />

      {showList && (
        <div className="food-picker-list" role="listbox">
          {results.map((option, index) => (
            <button
              type="button"
              key={option.nameKey}
              role="option"
              aria-selected={index === active}
              className={`food-picker-option ${index === active ? 'is-active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(option)}
            >
              <CategoryDot categoryId={option.categoryId} />
              <span className="food-picker-name">{option.name}</span>
              {option.tried ? (
                <small className="food-picker-tag">
                  {option.count} {option.count === 1 ? t.foods.once : t.foods.times}
                </small>
              ) : (
                <small className="food-picker-tag is-new">✨ {t.foods.newBadge}</small>
              )}
              {option.source === 'catalog' && (
                <small className="food-picker-source">{t.catalog.label}</small>
              )}
            </button>
          ))}
          {trimmed !== '' && !exact && (
            <div className="food-picker-manual">
              «{trimmed}» {t.catalog.manualNotFound}
            </div>
          )}
        </div>
      )}

      {showStatus && trimmed !== '' && (
        <p className={`food-picker-status ${exact?.tried ? '' : 'is-new'}`}>
          {exact?.tried
            ? `${t.catalog.alreadyTried} · ${exact.count} ${exact.count === 1 ? t.foods.once : t.foods.times}`
            : `✨ ${t.catalog.willBeNew}`}
        </p>
      )}
    </div>
  );
}
