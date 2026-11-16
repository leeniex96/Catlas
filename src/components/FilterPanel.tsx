import { useState } from "react";
import {
  AMENITIES,
  CAT_RULES,
  CATEGORIES,
  DOG_POLICIES,
  NOISE_LEVELS,
  SETTINGS,
} from "@/lib/options";
import { countActiveFilters, type FilterGroup, type Filters } from "@/lib/filters";
import Icon from "./Icon";
import { btnPrimary, btnSecondary, ChoiceChip } from "./ui";

interface Props {
  filters: Filters;
  onToggle: (group: FilterGroup, value: string) => void;
  onClear: () => void;
}

function Group({
  legend,
  group,
  options,
  filters,
  onToggle,
}: {
  legend: string;
  group: FilterGroup;
  options: readonly { value: string; label: string }[];
  filters: Filters;
  onToggle: Props["onToggle"];
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold tracking-wide text-plum-900 uppercase">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <ChoiceChip
            key={o.value}
            variant="tag"
            label={o.label}
            checked={(filters[group] as string[]).includes(o.value)}
            onChange={() => onToggle(group, o.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default function FilterPanel({ filters, onToggle, onClear }: Props) {
  // On phones the panel folds away; on large screens it's always open.
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);

  return (
    <section aria-label="Filters" className="mb-4 lg:mb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filter-body"
        className={`${btnPrimary} w-full justify-between lg:hidden`}
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="adjustments-horizontal" className="h-5 w-5" />
          Cat-friendly filters{active > 0 && ` (${active})`}
        </span>
        <Icon name={open ? "chevron-up" : "chevron-down"} className="h-5 w-5" />
      </button>

      <div
        id="filter-body"
        className={`${open ? "mt-3 block" : "hidden"} space-y-8 rounded-3xl border border-cream-200 bg-white p-5 lg:mt-0 lg:block`}
      >
        <div className="hidden items-center justify-between lg:flex">
          <h2 className="text-xl font-semibold">Filters</h2>
          {active > 0 && (
            <button type="button" onClick={onClear} className="text-sm font-semibold text-accent-700 underline">
              Clear all
            </button>
          )}
        </div>

        <Group legend="Category" group="category" options={CATEGORIES} filters={filters} onToggle={onToggle} />
        <Group legend="Dog policy" group="dogs" options={DOG_POLICIES} filters={filters} onToggle={onToggle} />
        <Group legend="Noise level" group="noise" options={NOISE_LEVELS} filters={filters} onToggle={onToggle} />
        <Group legend="Setting" group="setting" options={SETTINGS} filters={filters} onToggle={onToggle} />
        <Group
          legend="Cat rules"
          group="rule"
          options={CAT_RULES.map((r) => ({ value: r.key, label: r.label }))}
          filters={filters}
          onToggle={onToggle}
        />
        <Group
          legend="Amenities"
          group="amenity"
          options={AMENITIES.map((a) => ({ value: a.key, label: a.label }))}
          filters={filters}
          onToggle={onToggle}
        />

        {active > 0 && (
          <button type="button" onClick={onClear} className={`${btnSecondary} w-full lg:hidden`}>
            Clear all filters
          </button>
        )}
      </div>
    </section>
  );
}
