'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { connectionConverter } from '@/lib/firestore/client/converters';
import { Connection } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function SchedulePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const connectionId = params.connectionId as string;
    const confirmTimeStr = searchParams.get('time'); // For One-Click Confirmation

    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Proposer State
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [proposedSlots, setProposedSlots] = useState<Date[]>([]);

    useEffect(() => {
        const fetchConnection = async () => {
            try {
                const docRef = doc(db, 'connections', connectionId).withConverter(connectionConverter);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setConnection(docSnap.data());
                } else {
                    setError('Connection not found.');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchConnection();
    }, [connectionId]);

    // Handle One-Click Confirmation (Confirmer Logic)
    useEffect(() => {
        const handleOneClickConfirm = async () => {
            if (!connection || !confirmTimeStr || connection.status !== 'proposed') return;

            try {
                const confirmedDate = new Date(confirmTimeStr);
                if (isNaN(confirmedDate.getTime())) {
                    setError('Invalid time format.');
                    return;
                }

                const response = await fetch('/api/schedule/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        connectionId,
                        confirmedTime: confirmedDate.toISOString()
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to confirm connection via API');
                }

                setConnection(prev => prev ? { ...prev, status: 'scheduled', confirmedTime: Timestamp.fromDate(confirmedDate) } : null);
                setSuccessMessage('Connection confirmed! Check your email for the calendar invite.');
            } catch (err) {
                console.error(err);
                setError('Failed to confirm connection.');
            }
        };

        if (connection && confirmTimeStr && !successMessage) {
            handleOneClickConfirm();
        }
    }, [connection, confirmTimeStr, connectionId, successMessage]);


    const handleAddSlot = () => {
        if (!selectedDate || !selectedTime) return;

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const slot = new Date(selectedDate);
        slot.setHours(hours, minutes, 0, 0);

        // Avoid duplicates
        if (!proposedSlots.some(s => s.getTime() === slot.getTime())) {
            setProposedSlots([...proposedSlots, slot]);
        }
    };

    const handleRemoveSlot = (index: number) => {
        setProposedSlots(proposedSlots.filter((_, i) => i !== index));
    };

    const handleSubmitProposals = async () => {
        if (proposedSlots.length !== 3) {
            setError('Please select exactly 3 time slots.');
            return;
        }

        try {
            const response = await fetch('/api/schedule/propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId,
                    proposedTimes: proposedSlots.map(d => d.toISOString())
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit proposals via API');
            }

            setConnection(prev => prev ? { ...prev, status: 'proposed' } : null);
            setSuccessMessage('Proposals sent! We will notify you when your partner confirms.');
        } catch (err) {
            console.error(err);
            setError('Failed to submit proposals.');
        }
    };

    if (loading) return <div className="flex justify-center p-10">Loading...</div>;
    if (error) return <div className="flex justify-center p-10 text-red-500">{error}</div>;
    if (!connection) return null;

    // 1. Success State
    if (successMessage || connection.status === 'scheduled') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Card className="w-full max-w-md text-center p-6">
                    <CardHeader>
                        <CardTitle className="text-green-600">All Set!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            {successMessage || 'This connection is already scheduled.'}
                        </p>
                        {connection.confirmedTime && (
                            <p className="font-medium">
                                Confirmed Time: {format(connection.confirmedTime.toDate(), 'PPpp')}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 2. Proposer View (Status: scheduling)
    if (connection.status === 'scheduling') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Schedule Your Connection</CardTitle>
                        <CardDescription>
                            Please propose 3 times that work for you. Your partner will pick one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border"
                                    disabled={(date) => date < new Date()} // Disable past dates
                                />
                                <div className="mt-4 space-y-2">
                                    <label className="text-sm font-medium">Time</label>
                                    <Select onValueChange={setSelectedTime}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* Generate times from 8am to 8pm */}
                                            {Array.from({ length: 25 }).map((_, i) => {
                                                const hour = Math.floor(i / 2) + 8;
                                                const minute = i % 2 === 0 ? '00' : '30';
                                                const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                                                return (
                                                    <SelectItem key={timeStr} value={timeStr}>
                                                        {timeStr}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleAddSlot} className="w-full mt-2" disabled={!selectedTime}>
                                        Add Slot
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium mb-4">Proposed Slots ({proposedSlots.length}/3)</h3>
                                {proposedSlots.length === 0 && (
                                    <p className="text-sm text-gray-500">No slots selected yet.</p>
                                )}
                                <ul className="space-y-2">
                                    {proposedSlots.map((slot, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded border">
                                            <span className="text-sm">{format(slot, 'PP p')}</span>
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveSlot(idx)}>
                                                <span className="text-red-500">Remove</span>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleSubmitProposals} disabled={proposedSlots.length !== 3}>
                                Submit Proposals
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 3. Confirmer View (Status: proposed) - but without ?time param
    // If they land here without clicking a specific link, we could show them the list to pick from manually too.
    if (connection.status === 'proposed') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Confirm Connection</CardTitle>
                        <CardDescription>
                            Your partner has proposed the following times. Click one to confirm.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {connection.proposedTimes?.map((time, idx) => {
                            const date = time.toDate();
                            return (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="w-full justify-start h-auto py-3"
                                    onClick={() => {
                                        // Redirect to same page with ?time=... to trigger the effect
                                        window.location.href = `/schedule/${connectionId}?time=${date.toISOString()}`;
                                    }}
                                >
                                    {format(date, 'PPpp')}
                                </Button>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <div>Unknown status</div>;
}
