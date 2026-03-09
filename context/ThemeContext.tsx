import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isHolographic: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isHolographic: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHolographic, setIsHolographic] = useState(true);

  useEffect(() => {
    // Check local storage or default to true
    const saved = localStorage.getItem('theme_holographic');
    const shouldBeHolographic = saved === null ? true : saved === 'true';
    setIsHolographic(shouldBeHolographic);
    
    // Apply class to body for global CSS hooks
    if (shouldBeHolographic) {
      document.body.classList.add('holographic');
    } else {
      document.body.classList.remove('holographic');
    }
  }, []);

  const toggleTheme = () => {
    const newState = !isHolographic;
    setIsHolographic(newState);
    localStorage.setItem('theme_holographic', String(newState));
    
    if (newState) {
      document.body.classList.add('holographic');
    } else {
      document.body.classList.remove('holographic');
    }
  };

  return (
    <ThemeContext.Provider value={{ isHolographic, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};