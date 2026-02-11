import { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, AlertCircle, Loader2, FileText, UploadCloud, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { authAPI } from '@/lib/api';

// --- CONFIGURATION ---
// PASTE YOUR GOOGLE SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbys8wP6V0FxtQASS2MVWFoVO3SFF1n25OBNF2Vx6DTTtz-inEKGp-KJzau7fUU_vLMe/exec";

import { DEPARTMENTS } from '@/lib/constants';

export function SubmissionsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

    // Form Data State
    const [formData, setFormData] = useState({
        studentName: '',
        department: '',
        teamNumber: '',
        taskName: '',
        fileName: '',
        fileData: '', // base64
        mimeType: ''
    });

    // Load User Data on Mount
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Fast load from localStorage first
                const localUser = localStorage.getItem('user');
                if (localUser) {
                    const user = JSON.parse(localUser);
                    setFormData(prev => ({
                        ...prev,
                        studentName: user.name || '',
                        teamNumber: user.teamNumber || '',
                        department: user.departmentName || '' // Auto-fill department
                    }));
                }

                // Fresh fetch (optional, ensures data is up to date)
                const { user } = await authAPI.getCurrentUser();
                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        studentName: user.name || prev.studentName,
                        teamNumber: user.teamNumber || prev.teamNumber,
                        department: user.departmentName || prev.department
                    }));
                }
            } catch (e) {
                console.error("Failed to load user data", e);
            }
        };

        loadUserData();
    }, []);

    const handleFileChange = (file: File | undefined) => {
        if (!file) return;

        // Size Validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert("File size must be less than 10MB");
            return;
        }

        // Type Validation (Strict: PDF, DOC, DOCX Only)
        const allowedExtensions = ['pdf', 'doc', 'docx'];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

        if (!allowedExtensions.includes(fileExt)) {
            alert("Invalid file type. Only PDF, DOC, and DOCX files are allowed.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = (event.target?.result as string).split(',')[1];

            // Normalize Mime Type for Google Script consistency
            let mimeType = file.type;
            if (!mimeType) {
                if (fileExt === 'pdf') mimeType = 'application/pdf';
                else if (['doc', 'docx'].includes(fileExt)) mimeType = 'application/msword';
                else mimeType = 'application/octet-stream';
            }

            setFormData(prev => ({
                ...prev,
                fileName: file.name,
                mimeType: mimeType,
                fileData: base64String
            }));
            setSelectedFileObj(file); // Store separate file object for local preview url
            setFileError(false);
        };
        reader.readAsDataURL(file);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e.target.files?.[0]);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files?.[0]);
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, fileName: '', fileData: '', mimeType: '' }));
        setSelectedFileObj(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleViewFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedFileObj) {
            const url = URL.createObjectURL(selectedFileObj);
            window.open(url, '_blank');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual validation for file requirement
        if (!formData.fileName || !formData.fileData) {
            setFileError(true);
            setSubmitStatus('error');
            setStatusMessage('FILE REQUIRED: Please upload a document before submitting.');
            return;
        }

        setIsLoading(true);
        setSubmitStatus('idle');

        try {
            // We use mode: 'no-cors' because Google Apps Script redirects don't support CORS headers for the final response.
            // This means we won't strictly know if it succeeded or failed from the response body, 
            // but if no network error occurs, it likely reached the script.
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // Assume success if no error thrown
            setSubmitStatus('success');
            setStatusMessage('Submission successful! Ready for next task.');

            // Reset form (including file and task name) but keeping user details
            setFormData(prev => ({
                ...prev,
                taskName: '',
                fileName: '',
                fileData: '',
                mimeType: ''
            }));
            setSelectedFileObj(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Clear success message after delay (5 seconds)
            setTimeout(() => {
                setSubmitStatus('idle');
                setStatusMessage('');
            }, 5000);

        } catch (error) {
            console.error("Submission error:", error);
            setSubmitStatus('error');
            setStatusMessage('Failed to submit. Please check your internet and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFilePreview = () => {
        if (!formData.fileName) return null;

        const isPDF = formData.mimeType === 'application/pdf' || formData.fileName.toLowerCase().endsWith('.pdf');

        return (
            <div className="flex flex-col items-center justify-center p-4 space-y-4 w-full h-full animate-in fade-in zoom-in-50 duration-300 relative group">

                {/* File Icon */}
                <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-primary/20 group-hover:border-primary/50 transition-colors">
                    {isPDF ? (
                        <FileText className="h-12 w-12 text-red-500" />
                    ) : (
                        <FileText className="h-12 w-12 text-blue-500" />
                    )}
                </div>

                {/* File Name & Actions */}
                <div className="text-center w-full max-w-[200px]">
                    <p className="font-medium text-foreground truncate bg-background/50 px-2 py-1 rounded border border-border/50 text-sm mb-2" title={formData.fileName}>
                        {formData.fileName}
                    </p>

                    <div className="flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1"
                            onClick={handleViewFile}
                        >
                            <Eye className="h-3 w-3" /> View
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1"
                            onClick={handleRemoveFile}
                        >
                            <Trash2 className="h-3 w-3" /> Remove
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col p-6 bg-background overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Task Submission</h1>
                    <p className="text-muted-foreground">Submit your daily task proofs</p>
                </div>
            </div>

            <div className="flex-1 w-full max-w-6xl mx-auto">
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden h-full">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-border">

                        {/* Left Column: File Upload */}
                        <div className="p-8 flex flex-col h-full bg-muted/5 relative">
                            <div className="flex justify-between items-center mb-4">
                                <Label className={cn("text-lg font-medium transition-colors", fileError ? "text-red-600 dark:text-red-400" : "")}>
                                    Upload Document <span className="text-red-600 dark:text-red-400">*</span>
                                </Label>
                                {fileError && (
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400 animate-pulse">FILE REQUIRED</span>
                                )}
                            </div>
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[300px] relative overflow-hidden",
                                    // Mutually exclusive background/border logic to avoid conflicts
                                    fileError && !formData.fileName
                                        ? "!border-red-600 !bg-red-500/10 dark:!bg-red-900/20"
                                        : isDragging
                                            ? "border-primary bg-primary/5 scale-[0.99]"
                                            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
                                    formData.fileName ? "bg-background border-primary/20" : ""
                                )}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={onFileSelect}
                                    accept="image/*,application/pdf,.doc,.docx"
                                />

                                {formData.fileName ? (
                                    renderFilePreview()
                                ) : (
                                    <div className="text-center space-y-6 p-6">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto shadow-sm">
                                            <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-lg font-medium text-foreground">Drop files here to upload</p>
                                            <p className="text-sm text-muted-foreground">or <span className="text-blue-500 font-semibold hover:underline bg-background/50 px-2 py-0.5 rounded">browse files</span></p>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                                            <span className="px-2 py-1 bg-muted rounded">PDF</span>
                                            <span className="px-2 py-1 bg-muted rounded">DOCS</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground/60 w-full text-center">Max file size 10MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Form Fields */}
                        <div className="p-8 flex flex-col h-full bg-background overflow-y-auto">
                            <div className="flex-1 space-y-6 max-w-lg mx-auto w-full">
                                <div className="space-y-4">
                                    {/* Student Name (Read Only) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="studentName" className="text-muted-foreground">Student Name</Label>
                                        <Input
                                            id="studentName"
                                            value={formData.studentName}
                                            disabled
                                            className="bg-muted/30 border-muted font-medium text-foreground"
                                        />
                                    </div>

                                    {/* Department (Read Only - Auto-filled) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="department" className="text-muted-foreground">Department</Label>
                                        <Input
                                            id="department"
                                            value={formData.department}
                                            disabled
                                            className="bg-muted/30 border-muted font-medium text-foreground"
                                            placeholder="Auto-filled from profile"
                                        />
                                    </div>

                                    {/* Team Number (Read Only) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="teamNumber" className="text-muted-foreground">Team Number</Label>
                                        <Input
                                            id="teamNumber"
                                            value={formData.teamNumber}
                                            disabled
                                            className="bg-muted/30 border-muted font-medium text-foreground"
                                        />
                                    </div>

                                    {/* Task Name */}
                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="taskName" className="font-semibold text-foreground">Task Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="taskName"
                                            required
                                            placeholder="Enter task description..."
                                            value={formData.taskName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
                                            className="h-11 focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Submit Area */}
                                <div className="pt-8 mt-auto space-y-4">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Task"
                                        )}
                                    </Button>

                                    {submitStatus === 'success' && (
                                        <div className="flex items-center gap-3 p-3 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                                            <Check className="h-5 w-5 flex-shrink-0" />
                                            <span className="font-medium">{statusMessage}</span>
                                        </div>
                                    )}

                                    {submitStatus === 'error' && (
                                        <div className="flex items-center gap-3 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                            <span className="font-medium">{statusMessage}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
