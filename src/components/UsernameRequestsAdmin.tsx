"use client"
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AtSign, Check, X, Loader2, Clock, User, Mail, RefreshCw } from 'lucide-react';

interface UsernameRequest {
    uid: string;
    currentUsername: string | null;
    requestedUsername: string;
    displayName: string | null;
    email: string | null;
    requestedAt: any;
    status: 'pending' | 'approved' | 'rejected';
}

export default function UsernameRequestsAdmin() {
    const [requests, setRequests] = useState<UsernameRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Fetch pending requests
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const requestsRef = collection(db, 'usernameRequests');
            const q = query(requestsRef, where('status', '==', 'pending'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id
            })) as UsernameRequest[];
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch username requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Approve request
    const handleApprove = async (request: UsernameRequest) => {
        setProcessing(request.uid);
        try {
            const { uid, requestedUsername, currentUsername } = request;

            // Release old username if exists
            if (currentUsername) {
                await deleteDoc(doc(db, 'usernames', currentUsername));
            }

            // Reserve new username
            await setDoc(doc(db, 'usernames', requestedUsername), {
                uid: uid,
                createdAt: new Date()
            });

            // Update user profile with new username, give 1 more change, clear pending
            await updateDoc(doc(db, 'users', uid), {
                username: requestedUsername,
                usernameChangesLeft: 1, // Grant 1 more change after admin approval
                pendingUsernameChange: null,
                updatedAt: new Date()
            });

            // Update request status
            await updateDoc(doc(db, 'usernameRequests', uid), {
                status: 'approved',
                processedAt: new Date()
            });

            // Remove from local list
            setRequests(prev => prev.filter(r => r.uid !== uid));
        } catch (err) {
            console.error('Failed to approve request:', err);
        } finally {
            setProcessing(null);
        }
    };

    // Reject request
    const handleReject = async (request: UsernameRequest) => {
        setProcessing(request.uid);
        try {
            const { uid } = request;

            // Clear pending from user profile
            await updateDoc(doc(db, 'users', uid), {
                pendingUsernameChange: null,
                updatedAt: new Date()
            });

            // Update request status
            await updateDoc(doc(db, 'usernameRequests', uid), {
                status: 'rejected',
                processedAt: new Date()
            });

            // Remove from local list
            setRequests(prev => prev.filter(r => r.uid !== uid));
        } catch (err) {
            console.error('Failed to reject request:', err);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <AtSign size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)]">Username Change Requests</h3>
                        <p className="text-[10px] text-[var(--foreground-muted)]">
                            {requests.length} pending request{requests.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchRequests}
                    className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--foreground-muted)] hover:text-cyan-400 transition-colors"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-cyan-400" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock size={32} className="text-[var(--foreground-muted)]/30 mx-auto mb-3" />
                        <p className="text-sm text-[var(--foreground-muted)]">No pending requests</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(request => (
                            <div
                                key={request.uid}
                                className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl"
                            >
                                <div className="flex items-start gap-4">
                                    {/* User Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User size={14} className="text-[var(--foreground-muted)]" />
                                            <span className="font-medium text-sm text-[var(--foreground)]">
                                                {request.displayName || 'User'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3 text-[10px] text-[var(--foreground-muted)]">
                                            <Mail size={10} />
                                            {request.email || 'No email'}
                                        </div>

                                        {/* Username Change */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="px-2 py-1 bg-zinc-500/20 text-zinc-400 rounded font-mono">
                                                @{request.currentUsername || 'none'}
                                            </span>
                                            <span className="text-[var(--foreground-muted)]">→</span>
                                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded font-mono font-bold">
                                                @{request.requestedUsername}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <p className="text-[9px] text-[var(--foreground-muted)] mt-2">
                                            Requested: {new Date(request.requestedAt?.seconds * 1000 || request.requestedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(request)}
                                            disabled={processing === request.uid}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                                        >
                                            {processing === request.uid ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Check size={12} />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(request)}
                                            disabled={processing === request.uid}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition-colors"
                                        >
                                            <X size={12} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
