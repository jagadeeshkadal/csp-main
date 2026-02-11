import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Video, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialVideo {
    id: string;
    title: string;
    description: string;
    duration: string;
    color: string;
}

export function TutorialsPage() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const tutorialVideos: TutorialVideo[] = [
        {
            id: '1',
            title: 'Getting Started with Chat',
            description: 'Learn how to start a new chat, switch between agents, and use text messaging features.',
            duration: '2:30',
            color: 'bg-blue-500/10 text-blue-500'
        },
        {
            id: '2',
            title: 'Using Voice Communication',
            description: 'Master the voice interface, including mute, hold, and interruption settings.',
            duration: '3:45',
            color: 'bg-purple-500/10 text-purple-500'
        },
        {
            id: '3',
            title: 'Managing Settings',
            description: 'Configure your profile, notification preferences, and application theme.',
            duration: '1:15',
            color: 'bg-amber-500/10 text-amber-500'
        }
    ];

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % tutorialVideos.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + tutorialVideos.length) % tutorialVideos.length);
    };

    return (
        <div className="h-full overflow-y-auto p-6 bg-background">
            <h1 className="text-3xl font-bold mb-6">Tutorials</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Training Videos
                </h2>

                <Card className="overflow-hidden border-border/50 shadow-sm">
                    <CardContent className="p-0">
                        <div className="relative">
                            <div className="flex flex-col md:flex-row h-full">
                                {/* Video Placeholder */}
                                <div className={`w-full md:w-2/3 aspect-video md:aspect-auto md:h-80 ${tutorialVideos[currentSlide].color} flex flex-col items-center justify-center relative group cursor-pointer transition-colors duration-300`}>
                                    <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Play className="h-6 w-6 ml-1 text-foreground" fill="currentColor" />
                                    </div>
                                    <p className="mt-4 font-medium opacity-80">Click to watch tutorial</p>

                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        {tutorialVideos[currentSlide].duration}
                                    </div>
                                </div>

                                {/* Content & Navigation Sidebar */}
                                <div className="w-full md:w-1/3 p-6 flex flex-col justify-between bg-card">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                Tutorial {currentSlide + 1} of {tutorialVideos.length}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">{tutorialVideos[currentSlide].title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {tutorialVideos[currentSlide].description}
                                        </p>
                                    </div>

                                    {/* Navigation Controls */}
                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
                                        <div className="flex gap-1">
                                            {tutorialVideos.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
                                                />
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" onClick={prevSlide} className="h-9 w-9 rounded-full">
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button variant="default" size="icon" onClick={nextSlide} className="h-9 w-9 rounded-full shadow-md">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
