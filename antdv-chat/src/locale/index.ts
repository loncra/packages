export interface EmojiButtonLocale {
  smileys_emotion: string
  animals_nature: string
  food_drink: string
  travel_places: string
  activities: string
  objects: string
}

export interface Locale {
  locale: string
  EmojiButton?: EmojiButtonLocale
}
