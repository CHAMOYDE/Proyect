import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
        >
            <div className={`toggle-track ${darkMode ? 'dark' : ''}`}>
                <div className="toggle-thumb">
                    {darkMode ? '🌙' : '☀️'}
                </div>
            </div>
        </button>
    );
};

export default DarkModeToggle;