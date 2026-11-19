// Коды — те же, что в docs/sources.md. Новый источник сначала добавляется туда.
export const sources = {
  U5: { title: 'UNICEF: что такое стресс', url: 'https://www.unicef.org/parenting/mental-health/what-is-stress' },
  U7: { title: 'UNICEF: помочь подростку при срыве', url: 'https://www.unicef.org/parenting/mental-health/help-your-teenager-manage-meltdown' },
  U8: { title: 'UNICEF: депрессия, стресс и тревога у детей', url: 'https://www.unicef.org/asia-pacific/place-for-parents/supporting-children-depression-stress-and-anxiety' },
  U16: { title: 'UNICEF: когда нужна помощь специалиста', url: 'https://www.unicef.org/parenting/mental-health/when-help-your-teen-find-mental-health-support' },
  W4: { title: 'ВОЗ: Doing What Matters in Times of Stress', url: 'https://www.who.int/publications/i/item/9789240003927' },
  W5: { title: 'ВОЗ: как безопасно писать о суициде', url: 'https://www.who.int/publications/i/item/9789240076846' },
  W6: { title: 'Orygen: #chatsafe', url: 'https://www.orygen.org.au/chatsafe' },
  S1: { title: 'Gollwitzer & Sheeran, 2006: намерения реализации', url: 'https://doi.org/10.1016/S0065-2601(06)38002-1' },
  S3: { title: 'Sirois & Pychyl, 2013: прокрастинация и настроение', url: 'https://doi.org/10.1111/spc3.12011' },
  R1: { title: 'Детский телефон доверия 8-800-2000-122', url: 'https://telefon-doveria.ru/' },
} as const

export type SourceCode = keyof typeof sources
