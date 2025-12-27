"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface Device {
    id: string;
    name: string;
    type: 'web' | 'mobile' | 'desktop';
    isActive: boolean;
    lastSeen: Date;
    userId: string;
}

interface DeviceContextType {
    currentDevice: Device | null;
    devices: Device[];
    activeDevice: Device | null;
    registerDevice: () => Promise<void>;
    switchToDevice: (deviceId: string) => Promise<void>;
    unregisterDevice: () => Promise<void>;
    isRemoteControlling: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Generate unique device ID
const getDeviceId = () => {
    if (typeof window === 'undefined') return '';
    let deviceId = localStorage.getItem('nitro_device_id');
    if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('nitro_device_id', deviceId);
    }
    return deviceId;
};

// Detect device type
const getDeviceType = (): 'web' | 'mobile' | 'desktop' => {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/electron/i.test(ua)) return 'desktop';
    return 'web';
};

// Get device name
const getDeviceName = (): string => {
    if (typeof window === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    if (/Chrome/i.test(ua)) return 'Chrome Browser';
    if (/Firefox/i.test(ua)) return 'Firefox Browser';
    if (/Safari/i.test(ua)) return 'Safari Browser';
    if (/Edge/i.test(ua)) return 'Edge Browser';
    return 'Web Browser';
};

export const DeviceProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [activeDevice, setActiveDevice] = useState<Device | null>(null);
    const [isRemoteControlling, setIsRemoteControlling] = useState(false);

    // Register this device when user logs in
    const registerDevice = async () => {
        if (!user) return;

        const deviceId = getDeviceId();
        const device: Device = {
            id: deviceId,
            name: getDeviceName(),
            type: getDeviceType(),
            isActive: true,
            lastSeen: new Date(),
            userId: user.uid
        };

        try {
            const deviceRef = doc(db, 'users', user.uid, 'devices', deviceId);
            await setDoc(deviceRef, device);
            setCurrentDevice(device);
            setActiveDevice(device);
        } catch (err) {
            console.error('Failed to register device:', err);
        }
    };

    // Switch playback to another device
    const switchToDevice = async (deviceId: string) => {
        if (!user) return;

        try {
            // Deactivate all devices
            const devicesRef = collection(db, 'users', user.uid, 'devices');
            const snapshot = await getDocs(devicesRef);
            const batch: Promise<void>[] = [];

            snapshot.forEach(docSnap => {
                const ref = doc(db, 'users', user.uid, 'devices', docSnap.id);
                batch.push(setDoc(ref, {
                    ...docSnap.data(),
                    isActive: docSnap.id === deviceId
                }, { merge: true }));
            });

            await Promise.all(batch);

            // Update local state
            const targetDevice = devices.find(d => d.id === deviceId);
            if (targetDevice) {
                setActiveDevice({ ...targetDevice, isActive: true });
                setIsRemoteControlling(deviceId !== currentDevice?.id);
            }
        } catch (err) {
            console.error('Failed to switch device:', err);
        }
    };

    // Unregister device on logout/close
    const unregisterDevice = async () => {
        if (!user || !currentDevice) return;

        try {
            const deviceRef = doc(db, 'users', user.uid, 'devices', currentDevice.id);
            await deleteDoc(deviceRef);
            setCurrentDevice(null);
        } catch (err) {
            console.error('Failed to unregister device:', err);
        }
    };

    // Listen for device changes
    useEffect(() => {
        if (!user) {
            setDevices([]);
            setCurrentDevice(null);
            setActiveDevice(null);
            return;
        }

        const devicesRef = collection(db, 'users', user.uid, 'devices');
        const unsubscribe = onSnapshot(devicesRef, (snapshot) => {
            const deviceList = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                lastSeen: doc.data().lastSeen?.toDate() || new Date()
            })) as Device[];

            setDevices(deviceList);

            // Find active device
            const active = deviceList.find(d => d.isActive);
            if (active) {
                setActiveDevice(active);
                setIsRemoteControlling(active.id !== currentDevice?.id);
            }
        });

        // Register on mount
        registerDevice();

        return () => {
            unsubscribe();
        };
    }, [user]);

    // Update lastSeen periodically
    useEffect(() => {
        if (!user || !currentDevice) return;

        const interval = setInterval(async () => {
            const deviceRef = doc(db, 'users', user.uid, 'devices', currentDevice.id);
            await setDoc(deviceRef, { lastSeen: new Date() }, { merge: true });
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [user, currentDevice]);

    return (
        <DeviceContext.Provider value={{
            currentDevice,
            devices,
            activeDevice,
            registerDevice,
            switchToDevice,
            unregisterDevice,
            isRemoteControlling
        }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (!context) throw new Error("useDevice must be used within DeviceProvider");
    return context;
};
