import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Load saved theme from storage
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('appTheme');
                if (storedTheme) {
                    setTheme(storedTheme);
                } else if (systemColorScheme) {
                    setTheme(systemColorScheme);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };
        loadTheme();
    }, [systemColorScheme]);

    const toggleTheme = useCallback(async () => {
        try {
            const newTheme = theme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
            await AsyncStorage.setItem('appTheme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, [theme]);

    const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => useContext(ThemeContext);
