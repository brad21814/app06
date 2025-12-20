'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';
import { DeveloperQuestions } from '@/components/DeveloperQuestions';
import { 
  Users, 
  ArrowLeft, 
  Share2, 
  MessageSquare, 
  Copy,
  CheckCircle,
  Clock,
  Settings,
  UserPlus
} from 'lucide-react';

interface RoomData {
  id: string;
  challenge: {
    id: string;
    name: string;
    description?: string;
    game: {
      id: string;
      name: string;
      rules?: string;
    };
  };
  team: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
    };
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar_url?: string;
    };
    status: string;
    joined_at: string;
  }>;
  status: string;
  created_at: string;
}

interface ConnectionSessionData {
  id: string;
  status: string;
  userA: {
    id: string;
    name: string;
    email: string;
  };
  userB: {
    id: string;
    name: string;
    email: string;
  };
  sessionType: {
    id: string;
    name: string;
    durationMinutes: number;
    questionSet: {
      id: string;
      name: string;
      questions: Array<{
        id: string;
        questionText: string;
        orderIndex: number;
        timeLimitSeconds?: number | null;
      }>;
    };
  };
  org: {
    id: string;
    name: string;
  };
  roomId?: string | null;
  confirmedTime?: string | null;
  startedAt?: string | null;
}

export default function QuestionRoomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const sessionId = searchParams.get('sessionId');
  const roomId = searchParams.get('roomId'); // Legacy support
  
  const [sessionData, setSessionData] = useState<ConnectionSessionData | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const [sessionTime, setSessionTime] = useState(0);

  // Session timer effect
  useEffect(() => {
    if (sessionStarted && isJoined) {
      const timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionStarted, isJoined]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check authentication and load session/room data
  useEffect(() => {
    const checkAuthAndLoadSession = async () => {
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me');
        if (!authResponse.ok) {
          const currentUrl = sessionId 
            ? `/question-room?sessionId=${sessionId}`
            : `/question-room?roomId=${roomId}`;
          const loginUrl = `/sign-in?redirect=${encodeURIComponent(currentUrl)}&message=${encodeURIComponent('Please sign in to join your connection session')}`;
          router.push(loginUrl);
          return;
        }

        const user = await authResponse.json();
        setCurrentUser(user);

        // If sessionId is provided, load connection session
        if (sessionId) {
          const sessionResponse = await fetch(`/api/connection-sessions/${sessionId}`);
          if (!sessionResponse.ok) {
            if (sessionResponse.status === 404) {
              setError('Connection session not found');
            } else if (sessionResponse.status === 403) {
              setError('You do not have permission to access this session');
            } else {
              setError('Failed to load session data');
            }
            setIsLoading(false);
            return;
          }

          const session = await sessionResponse.json();
          setSessionData(session);

          // Verify user is part of the session
          if (session.userA.id !== user.id && session.userB.id !== user.id) {
            setError('You are not part of this connection session');
            setIsLoading(false);
            return;
          }

          // Load room data if room exists
          if (session.roomId) {
            const roomResponse = await fetch(`/api/rooms/${session.roomId}`);
            if (roomResponse.ok) {
              const room = await roomResponse.json();
              setRoomData(room);
              const isParticipant = room.participants?.some((p: any) => p.user.id === user.id);
              setIsJoined(isParticipant);
            }
          }

          // Check if session has already started
          if (session.startedAt) {
            setSessionStarted(true);
          }
        } else if (roomId) {
          // Legacy: Load room data directly
          const roomResponse = await fetch(`/api/rooms/${roomId}`);
          if (!roomResponse.ok) {
            if (roomResponse.status === 404) {
              setError('Question room not found');
            } else {
              setError('Failed to load room data');
            }
            setIsLoading(false);
            return;
          }

          const room = await roomResponse.json();
          setRoomData(room);
          const isParticipant = room.participants?.some((p: any) => p.user.id === user.id);
          setIsJoined(isParticipant);
        } else {
          setError('Missing session ID or room ID');
        }

      } catch (err) {
        console.error('Error loading session/room:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadSession();
  }, [sessionId, roomId, router]);

  const handleJoinRoom = async () => {
    try {
      const targetRoomId = sessionData?.roomId || roomId;
      if (!targetRoomId || !currentUser) return;

      const response = await fetch(`/api/rooms/${targetRoomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      // Refresh room data
      const roomResponse = await fetch(`/api/rooms/${targetRoomId}`);
      if (roomResponse.ok) {
        const updatedRoom = await roomResponse.json();
        setRoomData(updatedRoom);
        setIsJoined(true);
        
        toast({
          title: "Joined Successfully",
          description: "You've joined the connection session!",
        });
      }
    } catch (err) {
      console.error('Error joining room:', err);
      toast({
        title: "Join Failed",
        description: err instanceof Error ? err.message : 'Failed to join room',
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      const targetRoomId = sessionData?.roomId || roomId;
      if (!targetRoomId) return;

      const response = await fetch(`/api/rooms/${targetRoomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave room');
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error leaving room:', err);
      toast({
        title: "Leave Failed", 
        description: err instanceof Error ? err.message : 'Failed to leave room',
        variant: "destructive",
      });
    }
  };

  const handleShareRoom = async () => {
    try {
      const shareUrl = sessionId
        ? `${window.location.origin}/question-room?sessionId=${sessionId}`
        : `${window.location.origin}/question-room?roomId=${roomId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link Copied",
        description: "Connection session link copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Share Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSessionStart = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/connection-sessions/${sessionId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      setSessionStarted(true);
      setSessionTime(0);
      toast({
        title: "Session Started!",
        description: "Your connection session has begun.",
      });
    } catch (err) {
      console.error('Error starting session:', err);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    }
  };

  const handleSessionComplete = async () => {
    if (!sessionId) {
      setSessionStarted(false);
      toast({
        title: "Session Complete!",
        description: "Great job completing all the questions together!",
      });
      return;
    }

    try {
      const response = await fetch(`/api/connection-sessions/${sessionId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      setSessionStarted(false);
      toast({
        title: "Session Complete!",
        description: "Great job completing all the questions together!",
      });

      // Optionally redirect after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Error completing session:', err);
      toast({
        title: "Error",
        description: "Failed to mark session as complete",
        variant: "destructive",
      });
    }
  };

  const handleQuestionChange = async (questionId: string, questionIndex: number) => {
    // Optional: Track question progress in the database
    // This could be used for analytics or to resume sessions
    if (sessionId) {
      // Could save response tracking here if needed
      console.log('Question changed:', questionId, questionIndex);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <LoadingSpinner className="w-8 h-8" />
              <span className="ml-2">Loading question room...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || (!sessionData && !roomData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              {error || 'Failed to load session'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If not joined, show join interface
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Question Room
            </CardTitle>
            <CardDescription>
              Join your team for developer connection questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{roomData.challenge?.name}</h3>
              <p className="text-muted-foreground">{roomData.team?.name}</p>
              <Badge variant="secondary">{roomData.status}</Badge>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Current Participants ({roomData.participants?.length || 0})
              </h4>
              <div className="space-y-2">
                {roomData.participants?.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={participant.user.avatar_url} />
                      <AvatarFallback>
                        {participant.user.name?.charAt(0) || participant.user.email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{participant.user.name || participant.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {participant.status} • {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" size="sm">
                      {participant.status}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-4">
                    No participants yet
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="space-x-2">
            <Button onClick={handleJoinRoom} className="flex-1">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Session
            </Button>
            <Button onClick={handleShareRoom} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main room interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  {sessionData?.sessionType?.name || roomData?.challenge?.name || 'Connection Session'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {sessionData 
                    ? `${sessionData.userA.id === currentUser?.id ? sessionData.userB.name : sessionData.userA.name} • ${sessionData.org.name}`
                    : `${roomData?.team?.name} • ${roomData?.team?.organization?.name}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Session Timer */}
              {sessionStarted && (
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-lg font-mono font-bold text-green-600">
                      {formatTime(sessionTime)}
                    </div>
                    <div className="text-xs text-green-600">Session Time</div>
                  </div>
                </div>
              )}
              
              <Badge variant={isJoined ? "default" : "secondary"}>
                {isJoined ? "Joined" : "Not Joined"}
              </Badge>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleShareRoom} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Room
                </Button>
                
                <Button onClick={handleLeaveRoom} variant="outline" size="sm">
                  Leave Room
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Panel */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              {!sessionStarted && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Ready to Start?
                    </CardTitle>
                    <CardDescription>
                      Begin your connection session with {sessionData ? (sessionData.userA.id === currentUser?.id ? sessionData.userB.name : sessionData.userA.name) : 'your partner'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {sessionData?.sessionType?.questionSet?.questions 
                        ? `This session includes ${sessionData.sessionType.questionSet.questions.length} thoughtfully crafted questions from "${sessionData.sessionType.questionSet.name}".`
                        : 'This session includes thoughtfully crafted questions designed to help you learn about each other.'}
                    </p>
                    <Button 
                      onClick={handleSessionStart}
                      className="w-full"
                      disabled={!sessionId}
                    >
                      Start Connection Session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {sessionStarted && sessionData?.sessionType?.questionSet?.questions && (
              <DeveloperQuestions
                questions={sessionData.sessionType.questionSet.questions}
                sessionId={sessionId || undefined}
                timePerQuestion={120} // 2 minutes default
                onComplete={handleSessionComplete}
                onQuestionChange={handleQuestionChange}
                className="w-full"
              />
            )}
            
            {sessionStarted && !sessionData?.sessionType?.questionSet?.questions && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">
                    No questions available for this session. Please contact your administrator.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {!sessionStarted && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Preview</CardTitle>
                  <CardDescription>
                    What to expect in your developer connection session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">
                        {sessionData?.sessionType?.questionSet?.questions?.length || 20} Questions
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Carefully crafted conversation starters
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">
                        {sessionData?.sessionType?.durationMinutes || 20} Min Total
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Structured time for thoughtful answers
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium">Team Building</h4>
                      <p className="text-sm text-muted-foreground">
                        Build stronger connections
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Sample Questions Include:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• What's the most interesting coding project you've worked on outside of work?</li>
                      <li>• Share a tradition from your culture that you think your dev team would enjoy.</li>
                      <li>• What programming language did you first fall in love with and why?</li>
                      <li>• What's something unique about your hometown that influences your problem-solving?</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants
                </CardTitle>
                <CardDescription>
                  {roomData.participants?.length || 0} team members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionData ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {sessionData.userA.name?.charAt(0) || sessionData.userA.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {sessionData.userA.name || sessionData.userA.email}
                        </p>
                        {sessionData.userA.id === currentUser?.id && (
                          <Badge variant="outline" size="sm" className="mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {sessionData.userB.name?.charAt(0) || sessionData.userB.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {sessionData.userB.name || sessionData.userB.email}
                        </p>
                        {sessionData.userB.id === currentUser?.id && (
                          <Badge variant="outline" size="sm" className="mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  roomData?.participants?.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={participant.user.avatar_url} />
                      <AvatarFallback>
                        {participant.user.name?.charAt(0) || participant.user.email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {participant.user.name || participant.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.status}
                      </p>
                      {participant.user.id === currentUser?.id && (
                        <Badge variant="outline" size="sm" className="mt-1">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                  ))
                )}
                {!sessionData && !roomData?.participants?.length && (
                  <p className="text-center text-muted-foreground py-4">
                    No participants yet
                  </p>
                )}
                
                <div className="pt-3 border-t">
                  <Button 
                    onClick={handleShareRoom} 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Room Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Room Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {sessionData && (
                  <>
                    <div>
                      <strong>Session Type:</strong>
                      <p className="text-muted-foreground">{sessionData.sessionType.name}</p>
                    </div>
                    {sessionData.confirmedTime && (
                      <div>
                        <strong>Scheduled:</strong>
                        <p className="text-muted-foreground">
                          {new Date(sessionData.confirmedTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <strong>Status:</strong>
                      <Badge variant="secondary" size="sm">{sessionData.status}</Badge>
                    </div>
                  </>
                )}
                {roomData && (
                  <>
                    <div>
                      <strong>Room ID:</strong>
                      <p className="text-muted-foreground font-mono">{roomId || sessionData?.roomId}</p>
                    </div>
                    <div>
                      <strong>Created:</strong>
                      <p className="text-muted-foreground">
                        {new Date(roomData.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <Badge variant="secondary" size="sm">{roomData.status}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
