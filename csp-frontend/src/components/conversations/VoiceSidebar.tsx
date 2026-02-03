import { useState, useRef, useEffect } from 'react';
import { voiceAPI } from '@/lib/api';
import type { AIAgent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Phone, PhoneOff, Pause, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceSidebarProps {
  agent: AIAgent | null;
  conversationId: string | null;
  onClose?: () => void;
  className?: string;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function VoiceSidebar({ agent, conversationId, onClose, className }: VoiceSidebarProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHoldActive, setIsHoldActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [statusText, setStatusText] = useState<'listening' | 'thinking' | 'researching' | 'speaking' | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [pulseLevel, setPulseLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const noWordsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const hasDetectedWordsRef = useRef<boolean>(false);
  const interimTranscriptRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle audio playback when currentAudio changes - play immediately
  useEffect(() => {
    if (currentAudio && audioRef.current) {
      console.log('[VoiceSidebar] 🎵 Audio URL changed, loading and playing:', currentAudio);
      console.log('[VoiceSidebar] Current interim transcript:', interimTranscriptRef.current);
      const audio = audioRef.current;

      // Stop any currently playing audio and reset
      audio.pause();
      audio.currentTime = 0;

      // Load the audio - this will reset the readyState
      audio.load();
      console.log('[VoiceSidebar] 📥 Audio load() called, readyState:', audio.readyState);

      // Function to attempt playing
      const playAudio = () => {
        // Don't play if user is speaking
        if (interimTranscriptRef.current.trim()) {
          console.log('[VoiceSidebar] ⚠️ User speaking, not playing audio');
          return;
        }

        console.log('[VoiceSidebar] 🎵 Attempting to play audio...');
        console.log('[VoiceSidebar] Audio state - readyState:', audio.readyState, 'paused:', audio.paused, 'src:', audio.src);
        setIsPlayingAudio(true);
        setStatusText('speaking');
        audio.play().then(() => {
          console.log('[VoiceSidebar] ✅ Audio playback started successfully');
        }).catch(err => {
          console.error('[VoiceSidebar] ❌ Error playing audio:', err);
          setIsPlayingAudio(false);
          // If play fails, wait for canplay event
          const handleCanPlay = () => {
            if (!interimTranscriptRef.current.trim()) {
              audio.play().then(() => {
                console.log('[VoiceSidebar] ✅ Audio playback started after canplay');
                setIsPlayingAudio(true);
                setStatusText('speaking');
              }).catch(e => {
                console.error('[VoiceSidebar] ❌ Error playing after canplay:', e);
              });
            }
            audio.removeEventListener('canplay', handleCanPlay);
          };
          audio.addEventListener('canplay', handleCanPlay);
        });
      };

      // Try to play immediately if ready
      if (audio.readyState >= 3) {
        console.log('[VoiceSidebar] ⚡ Audio already ready, playing immediately');
        playAudio();
      } else {
        console.log('[VoiceSidebar] ⏳ Audio not ready yet, waiting for canplay event (readyState:', audio.readyState, ')');
        // Wait for canplay event
        const handleCanPlay = () => {
          console.log('[VoiceSidebar] 📢 canplay event fired');
          playAudio();
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay);

        // Also try after short delays in case event doesn't fire or audio loads quickly
        setTimeout(() => {
          if (audio.readyState >= 3 && audio.paused && !interimTranscriptRef.current.trim()) {
            console.log('[VoiceSidebar] ⚡ Audio ready after 100ms, playing');
            playAudio();
          }
        }, 100);

        setTimeout(() => {
          if (audio.readyState >= 3 && audio.paused && !interimTranscriptRef.current.trim()) {
            console.log('[VoiceSidebar] ⚡ Audio ready after 500ms, playing');
            playAudio();
          }
        }, 500);
      }
    }
  }, [currentAudio]);


  // Change status from "thinking..." to "researching..." after 1.5 seconds
  useEffect(() => {
    if (statusText === 'thinking') {
      const timer = setTimeout(() => {
        setStatusText('researching');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [statusText]);

  // Continuously monitor for speech and stop audio immediately when any word is detected
  useEffect(() => {
    const hasWords = interimTranscript.trim().length > 0;

    if (hasWords && audioRef.current && isPlayingAudio) {
      const audio = audioRef.current;
      const isCurrentlyPlaying = !audio.paused && !audio.ended && audio.currentTime > 0 && audio.readyState >= 2;

      if (isCurrentlyPlaying) {
        console.log('[VoiceSidebar] 🛑 Word detected in useEffect - immediately stopping audio playback');
        console.log('[VoiceSidebar] Audio state - paused:', audio.paused, 'currentTime:', audio.currentTime, 'isPlayingAudio:', isPlayingAudio);

        try {
          audio.pause();
          audio.currentTime = 0;
          setIsPlayingAudio(false);

          // After interrupting, go back to listening state
          if (isRecordingRef.current) {
            setStatusText('listening');
            // Clear any existing timer and reset - will start new timer when no words detected
            if (noWordsTimeoutRef.current) {
              clearTimeout(noWordsTimeoutRef.current);
              noWordsTimeoutRef.current = null;
            }
            // Mark that words are detected so timer can start when no words detected
            hasDetectedWordsRef.current = true;
            console.log('[VoiceSidebar] ✅ Audio stopped by useEffect, reset to listening state');
          } else {
            setStatusText(null);
          }
        } catch (e) {
          console.error('[VoiceSidebar] Error stopping audio in useEffect:', e);
          setIsPlayingAudio(false);
          if (isRecordingRef.current) {
            setStatusText('listening');
          } else {
            setStatusText(null);
          }
        }
      }
    }
  }, [interimTranscript, isPlayingAudio]);

  // Pulse animation for playing/thinking states
  useEffect(() => {
    if (isPlayingAudio || statusText) {
      const interval = setInterval(() => {
        setPulseLevel(0.3 + Math.sin(Date.now() / 300) * 0.1);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setPulseLevel(0);
    }
  }, [isPlayingAudio, statusText]);

  // Periodically check if no words are being detected and send if needed
  useEffect(() => {
    if (!isRecording || isProcessing) return;

    const checkInterval = setInterval(() => {
      // If we have detected words but currently no interim transcript and no recent activity
      if (hasDetectedWordsRef.current && !interimTranscript.trim()) {
        const hasText = finalTranscriptRef.current.trim();
        if (hasText && !noWordsTimeoutRef.current) {
          console.log('[VoiceSidebar] 🔍 Periodic check - no interim words, starting timer...');
          resetNoWordsTimer();
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(checkInterval);
  }, [isRecording, isProcessing, interimTranscript]);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              // Store final transcript
              finalTranscriptRef.current += transcript + ' ';
              hasDetectedWordsRef.current = true;
              console.log('[VoiceSidebar] 📝 Final transcript:', finalTranscript);
            } else {
              interim += transcript;
            }
          }

          setInterimTranscript(interim);
          interimTranscriptRef.current = interim; // Keep ref in sync for audio interruption checks

          // If user is speaking, interrupt any playing audio immediately
          if (interim.trim()) {
            // Force stop audio if playing - do this immediately
            if (audioRef.current) {
              const audio = audioRef.current;
              const wasPlaying = !audio.paused && audio.currentTime > 0 && !audio.ended;

              if (wasPlaying || isPlayingAudio) {
                console.log('[VoiceSidebar] 🛑 User speaking in onresult - interrupting audio');
                console.log('[VoiceSidebar] Audio state - paused:', audio.paused, 'currentTime:', audio.currentTime, 'isPlayingAudio:', isPlayingAudio);
                try {
                  // Multiple methods to ensure audio stops
                  audio.pause();
                  audio.currentTime = 0;
                  setIsPlayingAudio(false);

                  // After interrupting, go back to listening state
                  if (isRecordingRef.current) {
                    setStatusText('listening');
                    // Clear any existing timer - will start new timer when no words detected
                    if (noWordsTimeoutRef.current) {
                      clearTimeout(noWordsTimeoutRef.current);
                      noWordsTimeoutRef.current = null;
                    }
                    // Mark that words are detected so timer can start when no words detected
                    hasDetectedWordsRef.current = true;
                    console.log('[VoiceSidebar] ✅ Audio stopped in onresult, reset to listening state');
                  } else {
                    setStatusText(null);
                  }
                } catch (e) {
                  console.error('[VoiceSidebar] Error stopping audio in onresult:', e);
                  setIsPlayingAudio(false);
                  if (isRecordingRef.current) {
                    setStatusText('listening');
                  } else {
                    setStatusText(null);
                  }
                }
              }
            }
            // Mark that words are detected and reset timer
            hasDetectedWordsRef.current = true;
            // Reset the no-words timer since user is speaking
            if (noWordsTimeoutRef.current) {
              clearTimeout(noWordsTimeoutRef.current);
              noWordsTimeoutRef.current = null;
            }
          }

          // If words are detected (interim or final), clear the no-words timer
          if (interim.trim() || finalTranscript.trim()) {
            hasDetectedWordsRef.current = true;
            // Clear any existing timer since words are being detected
            if (noWordsTimeoutRef.current) {
              clearTimeout(noWordsTimeoutRef.current);
              noWordsTimeoutRef.current = null;
            }
            console.log('[VoiceSidebar] 📝 Words detected - interim:', interim.trim(), 'final:', finalTranscript.trim());
          } else {
            // No words detected in this result - if we previously detected words, start timer to send
            if (hasDetectedWordsRef.current && !noWordsTimeoutRef.current) {
              console.log('[VoiceSidebar] 🔇 No words detected, starting 2s timer to send...');
              resetNoWordsTimer();
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('[VoiceSidebar] ❌ Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            // No speech detected - check if we should send
            checkNoWordsAndSend();
          } else if (event.error === 'aborted') {
            // Do NOT restart on aborted - this causes infinite loops
            console.log('[VoiceSidebar] 🛑 Recognition aborted - stopping restart loop');
            return;
          } else if (isRecordingRef.current) {
            // Restart if still recording (continuous listening)
            setTimeout(() => {
              if (isRecordingRef.current && conversationId && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('[VoiceSidebar] ✅ Speech recognition restarted after error');
                } catch (e) {
                  console.log('[VoiceSidebar] Error restarting after error:', e);
                }
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          console.log('[VoiceSidebar] 🛑 Speech recognition ended');
          // Only restart if still recording AND no aborted error
          // Use ref to check isRecording to avoid stale closure
          if (isRecordingRef.current && conversationId) {
            setTimeout(() => {
              // Check again before restarting using ref
              if (isRecordingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('[VoiceSidebar] ✅ Speech recognition restarted (continuous listening)');
                } catch (e) {
                  console.log('[VoiceSidebar] Recognition already started or error:', e);
                }
              }
            }, 100); // Reduced timeout to 100ms
          }
        };


        recognitionRef.current = recognition;

        try {
          recognition.start();
        } catch (e) {
          console.error('[VoiceSidebar] Error starting recognition:', e);
        }
      }
    }

    return () => {
      // Don't stop recognition on cleanup if still recording - let onend handle restart
      if (noWordsTimeoutRef.current) {
        clearTimeout(noWordsTimeoutRef.current);
      }
      stopAudioVisualization();
    };
  }, [conversationId, isProcessing, isRecording]);

  const resetNoWordsTimer = () => {
    if (noWordsTimeoutRef.current) {
      clearTimeout(noWordsTimeoutRef.current);
    }
    // Set timer for 2 seconds of no words detected
    noWordsTimeoutRef.current = setTimeout(() => {
      checkNoWordsAndSend();
    }, 2000);
  };

  const checkNoWordsAndSend = () => {
    // Check if we have detected words and now no words are being detected
    if (hasDetectedWordsRef.current && isRecording && !isProcessing) {
      const hasText = finalTranscriptRef.current.trim() || interimTranscript.trim();
      console.log('[VoiceSidebar] 🔍 Checking to send - hasText:', hasText, 'final:', finalTranscriptRef.current.trim(), 'interim:', interimTranscript.trim());
      if (hasText) {
        console.log('[VoiceSidebar] ✅ No words detected for 2 seconds, auto-sending...');
        hasDetectedWordsRef.current = false; // Reset flag
        // Process transcript and send to server
        processTranscript();
      } else {
        console.log('[VoiceSidebar] ⚠️ No text to send, resetting flag');
        hasDetectedWordsRef.current = false;
      }
    }
  };


  const startCall = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      setIsCallActive(true);
      setIsMuted(false);
      recognitionRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setStatusText('listening');
      setInterimTranscript('');
      interimTranscriptRef.current = '';
      hasDetectedWordsRef.current = false;
      finalTranscriptRef.current = '';
      console.log('[VoiceSidebar] 📞 Call started');

      // Start audio visualization
      startAudioVisualization();
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start call. Please check microphone permissions.');
      setIsCallActive(false);
    }
  };

  const endCall = () => {
    setIsHoldActive(false);
    setIsCallActive(false);
    setIsMuted(false);
    stopRecording();
  };

  const toggleMute = () => {
    if (!isCallActive) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Mute/unmute the microphone track
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }

    console.log('[VoiceSidebar] 🎤 Microphone', newMutedState ? 'muted' : 'unmuted');
  };

  const handleHold = () => {
    const newHoldState = !isHoldActive;
    setIsHoldActive(newHoldState);

    if (newHoldState) {
      // Stop TTS audio abruptly
      if (audioRef.current) {
        console.log('[VoiceSidebar] 🛑 Hold pressed - stopping audio abruptly');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAudio(false);
        setCurrentAudio(null);
      }

      // Mute the microphone
      if (!isMuted && streamRef.current) {
        setIsMuted(true);
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
        console.log('[VoiceSidebar] 🎤 Hold pressed - muting microphone');
      }

      // Clear status
      if (statusText === 'speaking') {
        setStatusText(null);
      }
    } else {
      // Unmute the microphone when hold is released
      if (isMuted && streamRef.current) {
        setIsMuted(false);
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
        console.log('[VoiceSidebar] 🎤 Hold released - unmuting microphone');
      }
    }
  };



  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setAudioLevel(0);
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      setStatusText(null);

      // Stop any playing audio
      if (audioRef.current && !audioRef.current.paused) {
        console.log('[VoiceSidebar] 🛑 Stopping audio when stopping listening');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAudio(false);
        setCurrentAudio(null);
      }

      // Stop audio visualization
      stopAudioVisualization();

      if (noWordsTimeoutRef.current) {
        clearTimeout(noWordsTimeoutRef.current);
        noWordsTimeoutRef.current = null;
      }
      hasDetectedWordsRef.current = false;

      // Clear transcripts
      setInterimTranscript('');
      interimTranscriptRef.current = '';
      finalTranscriptRef.current = '';

      console.log('[VoiceSidebar] 🛑 Listening stopped and everything cleared');
    }
  };

  // Update audio visualization to respect mute state
  const startAudioVisualization = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Apply mute state if already muted
      if (isMuted) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      microphoneRef.current = microphone;

      // Start analyzing audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) {
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume (only if not muted)
        const average = isMuted ? 0 : dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

        setAudioLevel(normalizedLevel);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error starting audio visualization:', error);
      // Continue without visualization if it fails
    }
  };

  const processTranscript = async () => {
    if (!conversationId) return;

    // Combine final transcript with any remaining interim
    const finalText = (finalTranscriptRef.current.trim() + ' ' + interimTranscript.trim()).trim();

    if (!finalText) {
      console.log('[VoiceSidebar] ⚠️ No transcript to send');
      setInterimTranscript('');
      interimTranscriptRef.current = '';
      finalTranscriptRef.current = '';
      return;
    }

    setIsProcessing(true);
    setStatusText('thinking');
    setInterimTranscript('');
    interimTranscriptRef.current = ''; // Clear ref
    finalTranscriptRef.current = ''; // Clear for next recording

    try {
      console.log('[VoiceSidebar] 📤 Sending transcript to backend:', finalText);
      const response = await voiceAPI.processVoiceText(conversationId, finalText);

      console.log('[VoiceSidebar] ✅ Received response:', response);
      setStatusText(null); // Clear status when response received

      // Play agent audio response if available
      if (response.exchange.agentAudioUrl) {
        console.log('[VoiceSidebar] 🔊 Audio URL received:', response.exchange.agentAudioUrl);

        // Stop any currently playing audio first
        if (audioRef.current && !audioRef.current.paused) {
          console.log('[VoiceSidebar] 🛑 Stopping any existing audio before playing new one');
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlayingAudio(false);
        }

        // Set the audio source - this will trigger the useEffect to load and play it immediately
        setCurrentAudio(response.exchange.agentAudioUrl);
      } else {
        console.warn('[VoiceSidebar] ⚠️ No audio URL in response');
        console.warn('[VoiceSidebar] Response exchange:', response.exchange);
      }
    } catch (error) {
      console.error('Failed to process voice message:', error);
      setStatusText(null);
    } finally {
      setIsProcessing(false);
    }
  };


  const isSpeechSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Don't render if no agent is selected
  if (!agent) {
    return (
      <div className={cn("w-96 border-l bg-card flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select an agent to start voice chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-96 border-l bg-card flex flex-col h-full", className)}>
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {agent.avatar && (
            <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full" />
          )}
          <div>
            <h3 className="font-semibold">Voice Chat</h3>
            <p className="text-xs text-muted-foreground">{agent.name}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        src={currentAudio || undefined}
        preload="auto"
        onLoadedData={() => {
          console.log('[VoiceSidebar] ✅ Audio loaded successfully (loadeddata event)');
          console.log('[VoiceSidebar] Audio duration:', audioRef.current?.duration, 'seconds');
        }}
        onLoadedMetadata={() => {
          console.log('[VoiceSidebar] ✅ Audio metadata loaded');
        }}
        onError={(e) => {
          console.error('[VoiceSidebar] ❌ Audio loading error event:', e);
          const audio = audioRef.current;
          if (audio?.error) {
            const errorMessages: { [key: number]: string } = {
              1: 'MEDIA_ERR_ABORTED - The user aborted the loading',
              2: 'MEDIA_ERR_NETWORK - A network error occurred',
              3: 'MEDIA_ERR_DECODE - An error occurred while decoding',
              4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The audio format is not supported'
            };
            console.error('[VoiceSidebar] Audio error code:', audio.error.code);
            console.error('[VoiceSidebar] Audio error message:', errorMessages[audio.error.code] || 'Unknown error');
          }
          console.error('[VoiceSidebar] Audio element state:', {
            src: audio?.src,
            networkState: audio?.networkState,
            readyState: audio?.readyState,
            error: audio?.error
          });
        }}
        onCanPlay={() => {
          console.log('[VoiceSidebar] ✅ Audio can play (canplay event)');
        }}
        onCanPlayThrough={() => {
          console.log('[VoiceSidebar] ✅ Audio can play through (canplaythrough event)');
        }}
        onPlay={() => {
          // Don't set playing if user is speaking - use ref for latest value
          const currentInterim = interimTranscriptRef.current.trim();
          if (!currentInterim) {
            setIsPlayingAudio(true);
            setStatusText('speaking');
          } else {
            // User is speaking, stop the audio immediately
            console.log('[VoiceSidebar] 🛑 User speaking when audio tries to play - stopping');
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            setIsPlayingAudio(false);

            // After interrupting, go back to listening state
            if (isRecordingRef.current) {
              setStatusText('listening');
              // Clear any existing timer - will start new timer when no words detected
              if (noWordsTimeoutRef.current) {
                clearTimeout(noWordsTimeoutRef.current);
                noWordsTimeoutRef.current = null;
              }
              // Mark that words are detected so timer can start when no words detected
              hasDetectedWordsRef.current = true;
            } else {
              setStatusText(null);
            }
          }
        }}
        onPause={() => {
          setIsPlayingAudio(false);
        }}
        onEnded={() => {
          setIsPlayingAudio(false);
          setStatusText(null);
        }}
        onTimeUpdate={() => {
          // Continuously check if user is speaking and stop audio if needed
          // Use ref to get the latest value
          const currentInterim = interimTranscriptRef.current.trim();
          if (currentInterim && audioRef.current && !audioRef.current.paused) {
            console.log('[VoiceSidebar] 🛑 User speaking during playback - stopping via timeUpdate');
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlayingAudio(false);

            // After interrupting, go back to listening state
            if (isRecordingRef.current) {
              setStatusText('listening');
              // Clear any existing timer - will start new timer when no words detected
              if (noWordsTimeoutRef.current) {
                clearTimeout(noWordsTimeoutRef.current);
                noWordsTimeoutRef.current = null;
              }
              // Mark that words are detected so timer can start when no words detected
              hasDetectedWordsRef.current = true;
            } else {
              setStatusText(null);
            }
          }
        }}
        crossOrigin="anonymous"
      />

      {/* Circular Visualizer - Always visible in center */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {(() => {
            // Calculate animation level - use audioLevel when speaking, or pulse when playing/thinking
            const animationLevel = isRecording && audioLevel > 0
              ? audioLevel
              : (isPlayingAudio || statusText)
                ? pulseLevel
                : 0;

            return (
              <>
                {/* Outer glow ring */}
                <div
                  className="absolute rounded-full transition-all duration-100"
                  style={{
                    width: `${180 + animationLevel * 60}px`,
                    height: `${180 + animationLevel * 60}px`,
                    background: `radial-gradient(circle, rgba(59, 130, 246, ${isRecording || isPlayingAudio || statusText ? 0.2 + animationLevel * 0.3 : 0.1}) 0%, rgba(59, 130, 246, ${isRecording || isPlayingAudio || statusText ? 0.05 + animationLevel * 0.1 : 0.03}) 50%, transparent 70%)`,
                    opacity: isRecording || isPlayingAudio || statusText ? 0.6 + animationLevel * 0.4 : 0.3,
                    transform: `scale(${isRecording || isPlayingAudio || statusText ? 1 + animationLevel * 0.2 : 1})`,
                  }}
                />

                {/* Middle cloud-like layer */}
                <div
                  className="absolute rounded-full transition-all duration-100"
                  style={{
                    width: `${160 + animationLevel * 50}px`,
                    height: `${160 + animationLevel * 50}px`,
                    background: `radial-gradient(circle at 30% 30%, rgba(147, 197, 253, ${isRecording || isPlayingAudio || statusText ? 0.4 + animationLevel * 0.3 : 0.2}) 0%, rgba(96, 165, 250, ${isRecording || isPlayingAudio || statusText ? 0.3 + animationLevel * 0.2 : 0.15}) 40%, rgba(59, 130, 246, ${isRecording || isPlayingAudio || statusText ? 0.2 + animationLevel * 0.2 : 0.1}) 70%, rgba(37, 99, 235, ${isRecording || isPlayingAudio || statusText ? 0.1 + animationLevel * 0.1 : 0.05}) 100%)`,
                    opacity: isRecording || isPlayingAudio || statusText ? 0.7 + animationLevel * 0.3 : 0.4,
                    transform: `scale(${isRecording || isPlayingAudio || statusText ? 1 + animationLevel * 0.15 : 1})`,
                    filter: 'blur(8px)',
                  }}
                />

                {/* Main circular visualizer */}
                <div
                  className="relative rounded-full transition-all duration-100 flex items-center justify-center overflow-hidden"
                  style={{
                    width: `${140 + animationLevel * 40}px`,
                    height: `${140 + animationLevel * 40}px`,
                    background: `radial-gradient(circle at 25% 25%, 
                rgba(191, 219, 254, ${isRecording || isPlayingAudio || statusText ? 0.8 + animationLevel * 0.2 : 0.6}) 0%, 
                rgba(147, 197, 253, ${isRecording || isPlayingAudio || statusText ? 0.6 + animationLevel * 0.2 : 0.4}) 25%,
                rgba(96, 165, 250, ${isRecording || isPlayingAudio || statusText ? 0.5 + animationLevel * 0.2 : 0.3}) 50%,
                rgba(59, 130, 246, ${isRecording || isPlayingAudio || statusText ? 0.4 + animationLevel * 0.2 : 0.25}) 75%,
                rgba(37, 99, 235, ${isRecording || isPlayingAudio || statusText ? 0.3 + animationLevel * 0.1 : 0.2}) 100%)`,
                    boxShadow: `0 0 ${isRecording || isPlayingAudio || statusText ? 30 + animationLevel * 40 : 20}px rgba(59, 130, 246, ${isRecording || isPlayingAudio || statusText ? 0.4 + animationLevel * 0.4 : 0.3}), 
                          inset 0 0 ${isRecording || isPlayingAudio || statusText ? 20 + animationLevel * 20 : 15}px rgba(191, 219, 254, ${isRecording || isPlayingAudio || statusText ? 0.3 + animationLevel * 0.2 : 0.2})`,
                    transform: `scale(${isRecording || isPlayingAudio || statusText ? 1 + animationLevel * 0.1 : 1})`,
                  }}
                >
                  {/* Inner highlight */}
                  <div
                    className="absolute top-0 left-0 w-full h-full rounded-full transition-all duration-100"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, ${isRecording || isPlayingAudio || statusText ? 0.3 + animationLevel * 0.2 : 0.2}) 0%, transparent 60%)`,
                    }}
                  />
                </div>

                {/* Animated ripples - when recording, playing, or thinking */}
                {(isRecording || isPlayingAudio || statusText) && [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border-2 border-primary/30 dark:border-black/30 transition-all duration-300"
                    style={{
                      width: `${140 + animationLevel * 40 + i * 20}px`,
                      height: `${140 + animationLevel * 40 + i * 20}px`,
                      opacity: (0.3 - i * 0.1) * (1 - animationLevel * 0.5),
                      animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                ))}
              </>
            );
          })()}
        </div>

        {/* Status Text Indicator - Below the circular visualizer */}
        {statusText && (
          <div className="mt-4 text-center">
            <span className="text-lg font-medium text-foreground status-glow">
              {statusText === 'listening' && 'listening...'}
              {statusText === 'thinking' && 'thinking...'}
              {statusText === 'researching' && 'researching...'}
              {statusText === 'speaking' && 'speaking'}
            </span>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="border-t p-4 space-y-2">
        {!isSpeechSupported ? (
          <div className="text-center text-sm text-destructive">
            Speech recognition is not supported in your browser.
          </div>
        ) : (
          <>
            {/* Processing Indicator - Above buttons */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              {/* Start/End Call Button */}
              <Button
                onClick={isCallActive ? endCall : startCall}
                className="flex-1 text-xs px-2"
                variant={isCallActive ? "destructive" : "default"}
                size="sm"
                disabled={!conversationId || isProcessing}
              >
                {isCallActive ? (
                  <>
                    <PhoneOff className="h-4 w-4 mr-1" />
                    End
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>

              {/* Mute Button */}
              <Button
                onClick={toggleMute}
                className="flex-1 text-xs px-2"
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                disabled={!isCallActive || !conversationId || isProcessing}
              >
                {isMuted ? (
                  <>
                    <MicOff className="h-4 w-4 mr-1" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-1" />
                    Mute
                  </>
                )}
              </Button>

              {/* Hold Button */}
              <Button
                onClick={handleHold}
                className={`flex-1 text-xs px-2 ${isHoldActive ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : ''}`}
                variant={isHoldActive ? "default" : "outline"}
                size="sm"
                disabled={!isCallActive || !conversationId || isProcessing}
              >
                <Pause className="h-4 w-4 mr-1" />
                Hold
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
