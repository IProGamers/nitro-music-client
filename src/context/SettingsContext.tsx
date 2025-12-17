"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    enableDownload: boolean;
    setEnableDownload: (v: boolean) => void;
    enable3DAudio: boolean;
    setEnable3DAudio: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [enableDownload, setEnableDownload] = useState(false);
    const [enable3DAudio, setEnable3DAudio] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedDownload = localStorage.getItem('nitro_setting_download');
        const saved3D = localStorage.getItem('nitro_setting_3d');
        if (savedDownload) setEnableDownload(JSON.parse(savedDownload));
        if (saved3D) setEnable3DAudio(JSON.parse(saved3D));
    }, []);

    // Save settings when changed
    useEffect(() => {
        localStorage.setItem('nitro_setting_download', JSON.stringify(enableDownload));
    }, [enableDownload]);

    useEffect(() => {
        localStorage.setItem('nitro_setting_3d', JSON.stringify(enable3DAudio));
    }, [enable3DAudio]);

    return (
        <SettingsContext.Provider value={{ enableDownload, setEnableDownload, enable3DAudio, setEnable3DAudio }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};
