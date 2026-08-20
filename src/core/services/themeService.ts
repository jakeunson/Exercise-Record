export const ThemeService = {
  hexToRgb: (hex: string) => {
    let c = hex.substring(1);      // strip #
    if(c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const rgb = parseInt(c, 16);
    return `${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}`;
  },

  applyTheme: (color: string) => {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-rgb', ThemeService.hexToRgb(color));
  }
};
