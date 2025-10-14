'use client'
import { cn, configureAssistant, getSubjectColor } from "@/lib/utils"
import React, { useEffect, useState, useRef } from 'react';
import { vapi } from "@/lib/vapi.sdk"
import Image from 'next/image'; 
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from '@/constants/soundwaves.json'

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

interface CompanionComponentProps {
    companionId: string;
    subject: string;
    topic: string;
    name: string;
    userName: string;
    userImage: string;
    style: string;
    voice: string;
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [transcripts, setTranscripts] = useState<string[]>([]);
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (lottieRef.current) {
            if (isSpeaking) {
                lottieRef.current.play();
            } else {
                lottieRef.current.stop();
            }
        }
    }, [isSpeaking]);

    useEffect(() => {
        console.log('Call status changed to:', callStatus);
    }, [callStatus]);

    useEffect(() => {
        const onCallStart = () => {
            console.log('Call started');
            setCallStatus(CallStatus.ACTIVE);
        };
        
        const onCallEnd = () => {
            console.log('Call ended');
            setCallStatus(CallStatus.FINISHED);
        };
        
        const onMessage = (message: any) => {
            console.log('Message received:', message);
            if (message.type === 'transcript' && message.transcript) {
                setTranscripts(prev => [...prev, message.transcript]);
            }
        };
        
        const onSpeechStart = () => {
            console.log('Speech started');
            setIsSpeaking(true);
        };
        
        const onSpeechEnd = () => {
            console.log('Speech ended');
            setIsSpeaking(false);
        };
        
        const onError = (error: Error) => {
            console.log('Error:', error);
            setCallStatus(CallStatus.INACTIVE);
        };

        // Add more event listeners for better state tracking
        const onCallDidStart = () => {
            console.log('Call did start');
            setCallStatus(CallStatus.ACTIVE);
        };

        const onCallDidEnd = () => {
            console.log('Call did end');
            setCallStatus(CallStatus.FINISHED);
        };

        // Register all event listeners
        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('call-did-start', onCallDidStart);
        vapi.on('call-did-end', onCallDidEnd);

        return () => {
            // Clean up all event listeners
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('call-did-start', onCallDidStart);
            vapi.off('call-did-end', onCallDidEnd);
        };
    }, []);

    const toggleMicrophone = () => {
        const currentMutedState = vapi.isMuted();
        vapi.setMuted(!currentMutedState);
        setIsMuted(!currentMutedState);
    };

    const handleCall = async () => {
        console.log('Starting call...');
        setCallStatus(CallStatus.CONNECTING);
        
        try {
            const assistant = configureAssistant(voice, style);
            
            // Create a new assistant configuration with the variables properly replaced
            const assistantWithVariables = {
                ...assistant,
                firstMessage: assistant.firstMessage?.replace('{{topic}}', topic),
                model: assistant.model ? {
                    ...assistant.model,
                    messages: assistant.model.messages?.map(msg => ({
                        ...msg,
                        content: msg.role === 'system' && msg.content 
                            ? msg.content
                                .replace(/{{topic}}/g, topic)
                                .replace(/{{subject}}/g, subject)
                                .replace(/{{style}}/g, style)
                            : msg.content
                    }))
                } : undefined
            };

            console.log('Starting VAPI call with assistant:', assistantWithVariables);
            const result = await vapi.start(assistantWithVariables);
            console.log('VAPI start result:', result);
            
            // If we don't get an event, check the call status after a delay
            setTimeout(() => {
                console.log('Current call status after timeout:', callStatus);
            }, 2000);
            
        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const handleDisconnect = () => {
        console.log('Disconnecting call...');
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    };

    // Check current call status (for debugging)
    const checkCallStatus = () => {
        console.log('Current call status:', callStatus);
        console.log('Is speaking:', isSpeaking);
        console.log('Is muted:', isMuted);
    };

    return (
        <section className="flex flex-col h-[70vh]">
            {/* Debug button - remove in production */}
            <button 
                onClick={checkCallStatus}
                className="fixed top-4 right-4 bg-gray-500 text-white p-2 rounded text-sm z-50"
            >
                Debug Status
            </button>

            <section className="flex gap-8 max-sm:flex-col">
                <div className="companion-section">
                    <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}>
                        <div className={cn(
                            'absolute transition-opacity duration-1000',
                            (callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE) 
                                ? 'opacity-100' 
                                : 'opacity-0',
                            callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                        )}>
                            <Image 
                                src={`/icons/${subject}.svg`} 
                                alt={subject} 
                                width={150} 
                                height={150} 
                                className="max-sm:w-fit" 
                            />
                        </div>
                        <div className={cn(
                            'absolute transition-opacity duration-1000',
                            callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0'
                        )}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                loop={true}
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">{name}</p>
                </div>

                <div className="user-section">
                    <div className="user-avatar">
                        <Image 
                            src={userImage} 
                            alt={userName} 
                            width={130} 
                            height={130} 
                            className="rounded-lg"
                        />
                        <p className="font-bold text-2xl">{userName}</p>
                    </div>
                    
                    <button className="btn-mic" onClick={toggleMicrophone}>
                        <Image 
                            src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} 
                            alt="mic" 
                            width={36} 
                            height={36}
                        />
                        <p className="max-sm:hidden">
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                    </button>
                    
                    <button 
                        className={cn(
                            'rounded-lg py-2 cursor-pointer transition-colors w-full text-white font-bold',
                            callStatus === CallStatus.ACTIVE ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700',
                            callStatus === CallStatus.CONNECTING && 'animate-pulse bg-blue-400'
                        )} 
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        disabled={callStatus === CallStatus.CONNECTING}
                    >
                        {callStatus === CallStatus.ACTIVE
                            ? "End Session"
                            : callStatus === CallStatus.CONNECTING
                            ? 'Connecting...'
                            : 'Start Session'
                        }
                    </button>

                    {/* Status display for debugging */}
                    <div className="mt-2 text-sm text-gray-600">
                        Status: {callStatus}
                        {isSpeaking && " | Speaking"}
                        {isMuted && " | Muted"}
                    </div>
                </div>
            </section>

            <section className="transcript mt-4">
                <div className="transcript-message no-scrollbar p-4 border rounded-lg h-40 overflow-y-auto">
                    {transcripts.length === 0 ? (
                        "Messages will appear here..."
                    ) : (
                        transcripts.map((transcript, index) => (
                            <div key={index} className="transcript-item mb-2">
                                {transcript}
                            </div>
                        ))
                    )}
                </div>
                <div className="transcript-fade"/>
            </section>
        </section>
    );
}

export default CompanionComponent;