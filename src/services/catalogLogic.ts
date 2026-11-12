import type {
  CategoryInfo,
  CategorySlug,
  Product,
  ProductFilterState,
  SortOption,
} from '../types/store';

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: 'innerwear',
    name: "Women's Innerwear",
    shortName: 'Innerwear',
    description: 'Breathable, soft-touch everyday cotton-modal essentials crafted for gentle all-day support.',
    assetKey: 'cat_innerwear',
  },
  {
    slug: 'tops-14-plus',
    name: "Women's Tops – Age 14+",
    shortName: 'Tops',
    subtitle: '(14+ Years)',
    description: 'Fresh printed cotton tunics, embroidered kurtis, and effortless everyday tops for teens and women.',
    assetKey: 'cat_tops_14plus',
  },
  {
    slug: 'two-piece-sets',
    name: 'Two-Piece Sets',
    shortName: '2 Piece Sets',
    description: 'Co-ordinated top and trouser sets designed for effortless workdays, travel, and relaxed mornings.',
    assetKey: 'cat_two_piece_sets',
  },
  {
    slug: 'three-piece-sets',
    name: 'Three-Piece Sets',
    shortName: '3 Piece Sets',
    description: 'Complete kurta, trouser, and flowing dupatta ensembles suited for family gatherings and celebrations.',
    assetKey: 'cat_three_piece_sets',
  },
  {
    slug: 'nightwear-nighties',
    name: 'Nightwear and Nighties',
    shortName: 'Nightwear',
    description: 'Airy pure-cotton nighties and relaxed sleep dresses tailored for restful Indian nights.',
    assetKey: 'cat_nightwear_nighties',
  },
  {
    slug: 'pajamas',
    name: 'Pajamas',
    shortName: 'Pajamas',
    description: 'Button-down sleep shirts and soft drawstring lounge trousers in calming botanical prints.',
    assetKey: 'cat_pajamas',
  },
  {
    slug: 'maternity-wear',
    name: 'Maternity Wear',
    shortName: 'Maternity',
    description: 'Thoughtfully pleated bump-friendly silhouettes with discreet nursing convenience.',
    assetKey: 'cat_maternity_wear',
  },
  {
    slug: 'umbrella-long-tops',
    name: 'Umbrella-Style Long Tops',
    shortName: 'Long Tops',
    subtitle: '(Umbrella)',
    description: 'Gracefully flared Anarkali and umbrella-cut long tops with artisan prints and flattering movement.',
    assetKey: 'cat_long_tops',
  },
  {
    slug: 'maxi-dresses',
    name: 'Maxi Dresses',
    shortName: 'Maxi Dresses',
    description: 'Breezy tiered and full-length cotton maxi dresses made for sunlit afternoons and special moments.',
    assetKey: 'cat_maxi_dresses',
  },
];

export const CATEGORY_MAP: Record<CategorySlug, CategoryInfo> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.slug] = cat;
    return acc;
  },
  {} as Record<CategorySlug, CategoryInfo>
);

export function getCategoryLabel(slug: CategorySlug): string {
  return CATEGORY_MAP[slug]?.name ?? slug;
}

export function filterProducts(products: Product[], filters: ProductFilterState): Product[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return products.filter((product) => {
    if (!filters.includeNonActive && product.status === 'draft') {
      return false;
    }

    if (filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }

    if (filters.onlyNewArrivals && !product.isNewArrival) {
      return false;
    }

    if (filters.onlyBestSellers && !product.isBestSeller) {
      return false;
    }

    if (filters.sizes.length > 0) {
      const hasMatchingSize = filters.sizes.some((size) => product.sizes.includes(size));
      if (!hasMatchingSize) return false;
    }

    if (filters.colors.length > 0) {
      const lowerWantedColors = filters.colors.map((c) => c.toLowerCase());
      const hasMatchingColor = product.colors.some((c) =>
        lowerWantedColors.includes(c.name.toLowerCase())
      );
      if (!hasMatchingColor) return false;
    }

    if (filters.minPrice !== null && product.sellingPrice < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== null && product.sellingPrice > filters.maxPrice) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const catInfo = CATEGORY_MAP[product.category];
      const searchableText = [
        product.name,
        product.description,
        catInfo?.name ?? '',
        catInfo?.shortName ?? '',
        ...product.colors.map((c) => c.name),
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const copy = [...products];
  switch (sortBy) {
    case 'price-asc':
      return copy.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case 'price-desc':
      return copy.sort((a, b) => b.sellingPrice - a.sellingPrice);
    case 'popularity':
      return copy.sort((a, b) => b.popularityScore - a.popularityScore);
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export function getRelatedProducts(
  products: Product[],
  currentProduct: Product,
  limit = 4
): Product[] {
  const active = products.filter(
    (p) => p.id !== currentProduct.id && p.status !== 'draft'
  );
  const sameCategory = active.filter((p) => p.category === currentProduct.category);
  const others = active.filter((p) => p.category !== currentProduct.category);
  return [...sameCategory, ...others].slice(0, limit);
}

export function getPrimaryImage(product: Product) {
  return product.images.find((img) => img.isPrimary) ?? product.images[0] ?? null;
}
