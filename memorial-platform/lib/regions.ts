/**
 * Province / state / municipality lists, keyed by ISO 3166-1 alpha-2 country
 * code. Used to turn the birthplace/deathplace region field into a dropdown
 * instead of free text, so families pick a place rather than spelling it.
 *
 * Only a few important countries are seeded for now; a country with no entry
 * here falls back to a free-text region input. Region names are stored as
 * plain text (the value the family sees), so each list uses the country's own
 * canonical spelling rather than a per-UI-language translation.
 */

export const REGIONS_BY_COUNTRY: Record<string, readonly string[]> = {
  // 中国 — 34 个省级行政区
  CN: [
    "北京市",
    "天津市",
    "河北省",
    "山西省",
    "内蒙古自治区",
    "辽宁省",
    "吉林省",
    "黑龙江省",
    "上海市",
    "江苏省",
    "浙江省",
    "安徽省",
    "福建省",
    "江西省",
    "山东省",
    "河南省",
    "湖北省",
    "湖南省",
    "广东省",
    "广西壮族自治区",
    "海南省",
    "重庆市",
    "四川省",
    "贵州省",
    "云南省",
    "西藏自治区",
    "陕西省",
    "甘肃省",
    "青海省",
    "宁夏回族自治区",
    "新疆维吾尔自治区",
    "香港特别行政区",
    "澳门特别行政区",
    "台湾省",
  ],
  // United States — 50 states + DC
  US: [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
  // Canada — 10 provinces + 3 territories
  CA: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  // Australia — 6 states + 2 territories
  AU: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  // United Kingdom — 4 constituent countries
  GB: ["England", "Scotland", "Wales", "Northern Ireland"],
};

/** Returns the seeded region list for a country, or an empty array. */
export function regionsFor(countryCode: string): readonly string[] {
  return REGIONS_BY_COUNTRY[countryCode] ?? [];
}
