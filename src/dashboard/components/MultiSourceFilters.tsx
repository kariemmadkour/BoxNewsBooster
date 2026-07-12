interface MultiSourceFiltersProps {
  countries: string[];
  categories: string[];
  selectedCountry: string;
  selectedCategory: string;
  onCountryChange: (country: string) => void;
  onCategoryChange: (category: string) => void;
}

const ALL = "__all__";

// Options are built entirely from `countries`/`categories`, which the
// caller derives from the articles actually returned by fetchAllNews --
// nothing here is a hardcoded list.
export default function MultiSourceFilters({
  countries,
  categories,
  selectedCountry,
  selectedCategory,
  onCountryChange,
  onCategoryChange,
}: MultiSourceFiltersProps) {
  const selectClassName =
    "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 outline-none focus:border-emerald-400/50 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className={selectClassName}
      >
        <option value={ALL} className="bg-[#0c0f17]">
          All countries ({countries.length})
        </option>
        {countries.map((country) => (
          <option key={country} value={country} className="bg-[#0c0f17]">
            {country.toUpperCase()}
          </option>
        ))}
      </select>

      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectClassName}
      >
        <option value={ALL} className="bg-[#0c0f17]">
          All categories ({categories.length})
        </option>
        {categories.map((category) => (
          <option key={category} value={category} className="bg-[#0c0f17]">
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

export { ALL as ALL_FILTER_VALUE };
