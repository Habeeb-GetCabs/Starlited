import heroStarlitesEditorial from '../assets/images/hero_starlites_editorial_1794508080802.jpg';
import catInnerwear from '../assets/images/cat_innerwear_1794508080509.jpg';
import catTops14Plus from '../assets/images/cat_tops_14plus_1794508080947.jpg';
import catTwoPieceSets from '../assets/images/cat_two_piece_sets_1794508080922.jpg';
import catThreePieceSets from '../assets/images/cat_three_piece_sets_1794508081146.jpg';
import catNightwearNighties from '../assets/images/cat_nightwear_nighties_1794508080679.jpg';
import catPajamas from '../assets/images/cat_pajamas_1794508081511.jpg';
import catMaternityWear from '../assets/images/cat_maternity_wear_1794508082481.jpg';
import catLongTops from '../assets/images/cat_long_tops_1794508082561.jpg';
import catMaxiDresses from '../assets/images/cat_maxi_dresses_1794508083197.jpg';
import prodStoryRack from '../assets/images/prod_story_rack_1794508082704.jpg';
import promoFoldedSets from '../assets/images/promo_folded_sets_1794508082363.jpg';
import prodMustardTop from '../assets/images/prod_mustard_top_1794508085075.jpg';
import prodPlumThreepiece from '../assets/images/prod_plum_threepiece_1794508086881.jpg';
import prodFloralPajama from '../assets/images/prod_floral_pajama_1794508084319.jpg';
import prodMaroonUmbrella from '../assets/images/prod_maroon_umbrella_1794508085506.jpg';

export const ASSET_MAP: Record<string, string> = {
  hero_starlites_editorial: heroStarlitesEditorial,
  cat_innerwear: catInnerwear,
  cat_tops_14plus: catTops14Plus,
  cat_two_piece_sets: catTwoPieceSets,
  cat_three_piece_sets: catThreePieceSets,
  cat_nightwear_nighties: catNightwearNighties,
  cat_pajamas: catPajamas,
  cat_maternity_wear: catMaternityWear,
  cat_long_tops: catLongTops,
  cat_maxi_dresses: catMaxiDresses,
  prod_story_rack: prodStoryRack,
  promo_folded_sets: promoFoldedSets,
  prod_mustard_top: prodMustardTop,
  prod_plum_threepiece: prodPlumThreepiece,
  prod_floral_pajama: prodFloralPajama,
  prod_maroon_umbrella: prodMaroonUmbrella,
};

export function resolveAssetUrl(assetKey?: string): string | null {
  if (!assetKey) return null;
  return ASSET_MAP[assetKey] ?? null;
}
