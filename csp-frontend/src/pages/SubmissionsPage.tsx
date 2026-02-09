import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SubmissionsPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Your Google Form URL - replace with your actual form URL
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfjw4VFKZIHIRVG1FP7W190VaFKJ3BPEFqNTL16IF4AjoY_Kw/viewform?embedded=true';

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
            {/* Main Content */}
            <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Submissions</h1>
                    <p className="text-muted-foreground">
                        Click the button below to submit your data
                    </p>
                </div>

                <Button
                    onClick={() => setIsFormOpen(true)}
                    size="lg"
                    className="px-8 py-6 text-lg"
                >
                    Submit Data
                </Button>
            </div>

            {/* Google Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-semibold">Submission Form</h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Google Form iFrame */}
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={GOOGLE_FORM_URL}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                marginHeight={0}
                                marginWidth={0}
                                className="w-full h-full"
                            >
                                Loading…
                            </iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
