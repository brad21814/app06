'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Video, PhoneOff, Mic, MicOff, VideoOff, MessageSquare, ChevronLeft, ChevronRight, Play, Lock } from 'lucide-react';
import VideoFromTwilio, { Room, LocalTrack, RemoteTrack, LocalAudioTrack, LocalVideoTrack, RemoteAudioTrack, RemoteVideoTrack } from 'twilio-video';
import { getConnectionsCollection } from '@/lib/firestore/client/collections';
import { updateDoc, doc, onSnapshot, Timestamp, arrayUnion } from 'firebase/firestore';
import { QuestionEvent } from '@/types/firestore';

// Types
interface Participant {
    id: string;
    name: string;
    email: string;
    role: 'proposer' | 'confirmer';
}

interface Theme {
    name: string;
    questions: string[];
}

interface TimerSettings {
    minTime: number;
    maxTime: number;
}

interface ConnectionData {
    id: string;
    status: string;
    participants: Participant[];
    themeId?: string;
    connectRoomUniqueName?: string;
    theme?: Theme;
    timerSettings?: TimerSettings;
    startedAt?: any; // Timestamp
    questionEvents?: QuestionEvent[];
}

export default function ConnectionPage() {
    const params = useParams();
    const connectionId = params?.connectionId as string;
    const router = useRouter();
    // const { toast } = useToast();

    // State
    const [connection, setConnection] = useState<ConnectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);

    // Questions & Timer State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canNext, setCanNext] = useState(false);

    // Local Tracks State
    const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    // Fetch Connection Data
    // Firestore Real-time Listener (for Started Status)
    useEffect(() => {
        if (!connectionId) return;

        // Initial Fetch for heavy data (participants, theme details)
        const fetchConnectionInitial = async () => {
            try {
                const res = await fetch(`/api/connections/${connectionId}`);
                if (!res.ok) {
                    if (res.status === 403) throw new Error('Access Denied');
                    if (res.status === 404) throw new Error('Connection Not Found');
                    throw new Error('Failed to load connection');
                }
                const data = await res.json();
                setConnection(data); // Set initial data (including questions from API)
            } catch (error: any) {
                console.error(error);
                setError(error.message || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConnectionInitial();

        // Listen for status updates (Start Button sync)
        const unsub = onSnapshot(doc(getConnectionsCollection(), connectionId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConnection(prev => prev ? {
                    ...prev,
                    status: data.status,
                    startedAt: data.startedAt,
                    // If questions update (e.g. initially generated), update them too
                    theme: prev.theme ? { ...prev.theme, questions: data.questions || prev.theme.questions } : prev.theme
                } : null);
            }
        });

        return () => unsub();
    }, [connectionId]);

    const handleStartSession = async () => {
        if (!connectionId) return;
        try {
            await updateDoc(doc(getConnectionsCollection(), connectionId), {
                startedAt: Timestamp.now(),
                status: 'in_progress',
                questionEvents: arrayUnion({
                    question: connection?.theme?.questions?.[0] || 'First Question',
                    askedAt: Timestamp.now()
                })
            });
        } catch (error) {
            console.error("Error starting session:", error);
            toast.error("Failed to start session");
        }
    };

    // Handle Local Track Toggles
    const toggleAudio = async () => {
        if (!room) return;
        if (isAudioEnabled) {
            // Disable
            if (localAudioTrack) {
                localAudioTrack.stop();
                room.localParticipant.unpublishTrack(localAudioTrack);
                setLocalAudioTrack(null);
            }
            setIsAudioEnabled(false);
        } else {
            // Enable
            try {
                const track = await VideoFromTwilio.createLocalAudioTrack();
                const pub = await room.localParticipant.publishTrack(track);
                setLocalAudioTrack(track);
                setIsAudioEnabled(true);
            } catch (e: any) {
                toast.error('Failed to enable audio', { description: e.message });
            }
        }
    };

    const toggleVideo = async () => {
        if (!room) return;
        if (isVideoEnabled) {
            // Disable
            if (localVideoTrack) {
                localVideoTrack.stop();
                room.localParticipant.unpublishTrack(localVideoTrack);
                setLocalVideoTrack(null);
            }
            setIsVideoEnabled(false);
        } else {
            // Enable
            try {
                const track = await VideoFromTwilio.createLocalVideoTrack({ width: 640 });
                await room.localParticipant.publishTrack(track);
                setLocalVideoTrack(track);
                setIsVideoEnabled(true);
            } catch (e: any) {
                toast.error('Failed to enable video', { description: e.message });
            }
        }
    };

    const joinRoom = async () => {
        if (!connectionId) return;
        setIsJoining(true);

        try {
            // Get Token
            const res = await fetch('/api/twilio/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to get token');
            }

            const { token } = await res.json();

            // Connect to Twilio (Start with NO tracks)
            const newRoom = await VideoFromTwilio.connect(token, {
                name: connection?.connectRoomUniqueName,
                audio: false,
                video: false
            });

            setRoom(newRoom);
            setParticipants([...newRoom.participants.values()]);

            newRoom.on('participantConnected', (participant) => {
                setParticipants(prev => [...prev, participant]);
                toast(`${participant.identity} joined`);
            });

            newRoom.on('participantDisconnected', (participant) => {
                setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
                toast(`${participant.identity} left`);
            });

            newRoom.on('disconnected', () => {
                setRoom(null);
                setParticipants([]);
                // Cleanup local tracks if any
                if (localAudioTrack) { localAudioTrack.stop(); setLocalAudioTrack(null); }
                if (localVideoTrack) { localVideoTrack.stop(); setLocalVideoTrack(null); }
                setIsAudioEnabled(false);
                setIsVideoEnabled(false);
            });

            toast('Connected to Room', { description: `Joined ${newRoom.name}` });

        } catch (error: any) {
            console.error('Error joining room:', error);
            toast.error('Connection Failed', { description: error.message });
        } finally {
            setIsJoining(false);
        }
    };

    const leaveRoom = () => {
        if (room) {
            room.disconnect();
            setRoom(null);
        }
    };

    const questions = connection?.theme?.questions || ["Loading questions..."];
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQuestionIndex];

    const minTime = connection?.timerSettings?.minTime || 60;
    const maxTime = connection?.timerSettings?.maxTime || 180;



    // Closing Phase State
    const [isClosing, setIsClosing] = useState(false);
    const [closingTimeLeft, setClosingTimeLeft] = useState(30);
    const [isSessionEnded, setIsSessionEnded] = useState(false);

    // Timer Logic
    useEffect(() => {
        if (!room || !connection?.startedAt || isClosing) return;

        // Reset for new question
        setTimeLeft(maxTime);
        setCanNext(false);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newValue = prev - 1;
                const elapsed = maxTime - newValue;

                // Check min time constraint
                if (elapsed >= minTime) {
                    setCanNext(true);
                }

                // Check max time constraint (auto-advance)
                if (newValue <= 0) {
                    clearInterval(timer);
                    if (currentQuestionIndex < totalQuestions - 1) {
                        setCurrentQuestionIndex(curr => curr + 1);
                    } else {
                        // Last question finished
                        setIsClosing(true);
                    }
                    return 0;
                }
                return newValue;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestionIndex, room, maxTime, minTime, totalQuestions, connection?.startedAt, isClosing]);

    // Closing Countdown Effect
    useEffect(() => {
        if (!isClosing || isSessionEnded) return;

        const timer = setInterval(async () => {
            setClosingTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);

                    // 1. Terminate the Room via API (so it closes for everyone)
                    fetch(`/api/connections/${connectionId}/complete`, { method: 'POST' })
                        .catch(err => console.error("Failed to close room:", err));

                    // 2. Disconnect local participant
                    if (room) room.disconnect();

                    // 3. Update local state to show "Session Ended" view
                    setIsSessionEnded(true);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isClosing, connectionId, room, isSessionEnded]);

    const nextQuestion = async () => {
        if (!canNext) return;

        if (currentQuestionIndex < totalQuestions - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);

            // Log the next question event
            if (connectionId && questions[nextIndex]) {
                try {
                    await updateDoc(doc(getConnectionsCollection(), connectionId), {
                        questionEvents: arrayUnion({
                            question: questions[nextIndex],
                            askedAt: Timestamp.now()
                        })
                    });
                } catch (err) {
                    console.error("Failed to log question event:", err);
                }
            }

        } else {
            // Last question manually finished
            setIsClosing(true);
        }
    };

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <div className="p-8 flex justify-center">Loading connection...</div>;

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            {error === 'Access Denied' ? 'Access Denied' : 'Error'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-6">
                            {error === 'Access Denied'
                                ? "You are not a participant in this connection request. Only the scheduled participants can join this video session."
                                : error}
                        </p>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Control Panel (Header) */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                        <span className="sr-only">Back</span>
                        <VideoOff className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold text-lg">
                            {connection?.theme?.name || 'Connection Request'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            15 Min Connect
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-2 mr-4">
                        {/* Controls placeholders */}
                        <Button
                            variant={isAudioEnabled ? "default" : "outline"}
                            size="icon"
                            disabled={!room}
                            onClick={toggleAudio}
                        >
                            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant={isVideoEnabled ? "default" : "outline"}
                            size="icon"
                            disabled={!room}
                            onClick={toggleVideo}
                        >
                            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </Button>
                    </div>

                    {!room ? (
                        <Button onClick={joinRoom} disabled={isJoining}>
                            {isJoining ? 'Joining...' : 'Join Room'}
                        </Button>
                    ) : (
                        <Button variant="destructive" onClick={leaveRoom}>
                            Leave Room
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Side Panel (Participants) */}
                <aside className="w-64 bg-white border-r p-4 hidden md:block overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4" /> Participants
                        </h3>
                        <div className="space-y-3">
                            {connection?.participants?.map(p => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{p.name}</p>
                                        <p className="text-xs text-gray-400 capitalize">{p.role}</p>
                                    </div>
                                    {/* Check if in room logic could be added here */}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Panel */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {room ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[60vh] mb-6">
                            {/* Local Video */}
                            <Card className="bg-gray-900 border-0 overflow-hidden relative">
                                <CardContent className="p-0 h-full flex items-center justify-center text-white">
                                    {localVideoTrack ? (
                                        <VideoTrack track={localVideoTrack} />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Avatar className="w-20 h-20 mb-4 bg-gray-700">
                                                <AvatarFallback>Me</AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm text-gray-400">Camera Off</p>
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-xs font-medium">You</div>
                                </CardContent>
                            </Card>

                            {/* Remote Videos */}
                            {participants.length === 0 ? (
                                <Card className="bg-gray-900 border-0">
                                    <CardContent className="flex flex-col items-center justify-center h-full text-white">
                                        <p className="mb-2">Waiting for partner...</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                participants.map(participant => (
                                    <Participant
                                        key={participant.sid}
                                        participant={participant}
                                        localName={connection?.participants.find(p => p.id === participant.identity)?.name || participant.identity}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2">Ready to Connect?</h2>
                            <p className="text-gray-500 max-w-md mb-6">
                                The theme for this connection is <strong>{connection?.theme?.name || "Loading..."}</strong>.
                                Join the room to start the video session and see the question prompts.
                            </p>
                            <Button size="lg" onClick={joinRoom} disabled={isJoining}>
                                Start Session
                            </Button>
                        </Card>
                    )}

                    {/* Questions Section with Timer */}
                    {room && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-4">Theme Questions</h2>

                            {!connection?.startedAt ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                            <Play className="w-6 h-6 text-blue-600 ml-1" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Ready to Start?</h3>
                                        <p className="text-gray-500 mb-6 max-w-sm">
                                            Once everyone is ready, click start to begin the synchronized question timer for all participants.
                                        </p>
                                        <Button size="lg" onClick={handleStartSession}>
                                            Start Session Questions
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="p-6">
                                        {!isClosing && !isSessionEnded ? (
                                            <div className='flex flex-col items-center gap-4'>

                                                {/* Timer Display */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="text-2xl font-mono font-bold text-blue-600">
                                                        {formatTime(timeLeft)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        / {formatTime(maxTime)}
                                                    </div>
                                                </div>
                                                {/* Progress Bar (Optional visual) */}
                                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2 max-w-md">
                                                    <div
                                                        className="bg-blue-500 h-full transition-all duration-1000 ease-linear"
                                                        style={{ width: `${(timeLeft / maxTime) * 100}%` }}
                                                    />
                                                </div>

                                                <p className="text-lg font-medium text-center min-h-[4rem] flex items-center justify-center">
                                                    "{currentQuestion}"
                                                </p>

                                                <div className='flex items-center gap-4 w-full justify-center'>
                                                    {/* Previous button removed as per requirements */}

                                                    <div className='text-sm text-gray-500 font-medium'>
                                                        Question {currentQuestionIndex + 1} of {totalQuestions}
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={nextQuestion}
                                                        disabled={!canNext}
                                                    >
                                                        <ChevronRight className='w-4 h-4' />
                                                    </Button>
                                                </div>

                                                {!canNext && (
                                                    <p className="text-xs text-gray-400">
                                                        Next available in {formatTime(Math.max(0, minTime - (maxTime - timeLeft)))}
                                                    </p>
                                                )}
                                            </div>
                                        ) : isSessionEnded ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                                    <Users className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <h3 className="text-xl font-semibold">Session Ended</h3>
                                                <p className="text-center text-gray-500 max-w-sm">
                                                    The connection has wrapped up. You can now return to your dashboard or review the conversation.
                                                </p>
                                                <Button
                                                    onClick={() => router.push('/dashboard')}
                                                >
                                                    Return to Dashboard
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                                    <span className="text-2xl font-bold text-orange-600">{closingTimeLeft}</span>
                                                </div>
                                                <h3 className="text-xl font-semibold">Wrapping Up...</h3>
                                                <p className="text-center text-gray-500 max-w-sm">
                                                    Great job! The session will automatically close in {formatTime(closingTimeLeft)}. Say your goodbyes!
                                                </p>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        // Manual exit
                                                        setClosingTimeLeft(1); // will trigger effect immediately
                                                    }}
                                                >
                                                    End Now
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
}

// --- Helper Components ---

const VideoTrack = ({ track }: { track: LocalVideoTrack | RemoteVideoTrack }) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (el) {
            track.attach(el);
            return () => {
                // Check if detach method exists before calling (defensive)
                if (typeof track.detach === 'function') {
                    track.detach(el);
                }
            };
        }
    }, [track]);

    return <video ref={ref} className="w-full h-full object-cover" autoPlay playsInline />;
};

const AudioTrack = ({ track }: { track: LocalAudioTrack | RemoteAudioTrack }) => {
    const ref = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (el) {
            track.attach(el);
            return () => {
                if (typeof track.detach === 'function') {
                    track.detach(el);
                }
            };
        }
    }, [track]);

    return <audio ref={ref} autoPlay />;
};

const Participant = ({ participant, localName }: { participant: any, localName: string }) => {
    const [videoTracks, setVideoTracks] = useState<(RemoteVideoTrack)[]>([]); // simplified
    const [audioTracks, setAudioTracks] = useState<(RemoteAudioTrack)[]>([]);

    const trackpubsToTracks = (trackMap: Map<string, any>) =>
        Array.from(trackMap.values())
            .map(publication => publication.track)
            .filter(track => track !== null);

    useEffect(() => {
        const videoObjs = trackpubsToTracks(participant.videoTracks) as RemoteVideoTrack[];
        const audioObjs = trackpubsToTracks(participant.audioTracks) as RemoteAudioTrack[];

        setVideoTracks(videoObjs);
        setAudioTracks(audioObjs);

        const trackSubscribed = (track: any) => {
            if (track.kind === 'video') {
                setVideoTracks(prev => [...prev, track as RemoteVideoTrack]);
            } else if (track.kind === 'audio') {
                setAudioTracks(prev => [...prev, track as RemoteAudioTrack]);
            }
        };

        const trackUnsubscribed = (track: any) => {
            if (track.kind === 'video') {
                setVideoTracks(prev => prev.filter(t => t !== track));
            } else if (track.kind === 'audio') {
                setAudioTracks(prev => prev.filter(t => t !== track));
            }
        };

        participant.on('trackSubscribed', trackSubscribed);
        participant.on('trackUnsubscribed', trackUnsubscribed);

        // Handle already existing tracks for participants who joined before us
        participant.tracks.forEach((publication: any) => {
            if (publication.isSubscribed && publication.track) {
                trackSubscribed(publication.track);
            }
        });

        return () => {
            setVideoTracks([]);
            setAudioTracks([]);
            participant.removeAllListeners();
        };
    }, [participant]);

    // Only render the first video track (or avatar if none)
    const mainVideoTrack = videoTracks[0];

    return (
        <Card className="bg-gray-900 border-0 overflow-hidden relative">
            <CardContent className="p-0 h-full flex items-center justify-center text-white">
                {mainVideoTrack ? (
                    <VideoTrack track={mainVideoTrack} />
                ) : (
                    <div className="flex flex-col items-center">
                        <Avatar className="w-20 h-20 mb-4 bg-gray-700">
                            <AvatarFallback>{localName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-gray-400">Camera Off</p>
                    </div>
                )}
                {audioTracks.map((track, i) => <AudioTrack key={i} track={track} />)}
                <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-xs font-medium">{localName}</div>
            </CardContent>
        </Card>
    );
};
