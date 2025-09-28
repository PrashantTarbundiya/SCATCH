// Predefined color combinations for products
export const colorThemes = [
  {
    id: 'blue-gradient',
    name: 'Ocean Blue',
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    panelColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-900 dark:text-blue-100',
    accentColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'purple-gradient',
    name: 'Royal Purple',
    bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    panelColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-900 dark:text-purple-100',
    accentColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'green-gradient',
    name: 'Forest Green',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
    panelColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-900 dark:text-green-100',
    accentColor: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'orange-gradient',
    name: 'Sunset Orange',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
    panelColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-900 dark:text-orange-100',
    accentColor: 'text-orange-600 dark:text-orange-400'
  },
  {
    id: 'pink-gradient',
    name: 'Rose Pink',
    bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
    panelColor: 'bg-pink-50 dark:bg-pink-900/20',
    textColor: 'text-pink-900 dark:text-pink-100',
    accentColor: 'text-pink-600 dark:text-pink-400'
  },
  {
    id: 'indigo-gradient',
    name: 'Deep Indigo',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    panelColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-900 dark:text-indigo-100',
    accentColor: 'text-indigo-600 dark:text-indigo-400'
  }
];

// Get color theme by category
export const getColorThemeByCategory = (category) => {
  const categoryColorMap = {
    'Electronics': 'blue-gradient',
    'Clothing': 'purple-gradient',
    'Books': 'green-gradient',
    'Home': 'orange-gradient',
    'Beauty': 'pink-gradient',
    'Sports': 'indigo-gradient'
  };
  
  const themeId = categoryColorMap[category] || 'blue-gradient';
  return colorThemes.find(theme => theme.id === themeId) || colorThemes[0];
};

// Get random color theme
export const getRandomColorTheme = () => {
  return colorThemes[Math.floor(Math.random() * colorThemes.length)];
};