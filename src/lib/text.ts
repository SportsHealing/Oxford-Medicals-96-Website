// Lower-case, accents removed, so searches match loosely.
export const foldText = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
