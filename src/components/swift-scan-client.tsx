'use client';

import { useState, useCallback, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Link,
  Loader2,
  FileSignature,
  Camera,
  RefreshCw,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromImage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollableRawTextArea } from '@/components/scrollable-raw-text-area';

export function SwiftScanClient() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preserveLayout, setPreserveLayout] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [fileName, setFileName] = useState<string | null>(null);

  // Camera states and refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    try {
      setCameraLoading(true);
      setCameraError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (constraintErr) {
        console.warn('High resolution/facingMode constraint failed, using standard video:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => {
          console.warn('Video play interrupted:', playErr);
        });
      }
      setIsCameraActive(true);
      setFacingMode(mode);
    } catch (err: any) {
      console.error('Failed to access camera:', err);
      let message = 'Unable to access the camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on your system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently in use by another application.';
      } else if (err.message) {
        message = err.message;
      }
      setCameraError(message);
      setIsCameraActive(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: message,
      });
    } finally {
      setCameraLoading(false);
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    try {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error('Camera video stream is not ready for capture.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas context.');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.95);
      setImageDataUri(dataUri);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      setFileName(`camera-scan-${timestamp}.jpg`);
      stopCamera();

      toast({
        title: 'Document Captured',
        description: 'Photo captured from camera and ready for text extraction.',
      });
    } catch (err) {
      console.error('Failed to capture photo from camera:', err);
      toast({
        variant: 'destructive',
        title: 'Capture Error',
        description: 'Failed to capture photo from camera stream.',
      });
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFileChange = (file: File | null) => {
    try {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageDataUri(e.target?.result as string);
          setFileName(file.name);
        };
        reader.onerror = (e) => {
          console.error('FileReader failed to read image file:', e);
          toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the uploaded image file.',
          });
        };
        reader.readAsDataURL(file);
      } else {
        console.error('Invalid file type uploaded. Expected an image, received:', file?.type || 'unknown');
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please upload a valid image file.',
        });
      }
    } catch (err) {
      console.error('Unexpected error during file selection:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process the selected file.',
      });
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      handleFileChange(e.target.files?.[0] || null);
    } catch (err) {
      console.error('Error in handleFileSelect:', err);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileChange(e.dataTransfer.files?.[0] || null);
    } catch (err) {
      console.error('Error in handleDrop:', err);
    }
  };

  const handleSubmit = async () => {
    const source = activeTab === 'url' ? imageUrl : imageDataUri;
    if (!source) {
      const errorMsg = 'Please upload an image, capture a photo with your camera, or provide an image URL.';
      console.error('Submit validation error:', errorMsg);
      toast({
        variant: 'destructive',
        title: 'No Image Provided',
        description: errorMsg,
      });
      return;
    }

    setIsProcessing(true);
    setExtractedText(null);

    try {
      const result = await extractTextFromImage({
        photoDataUri: source,
        layoutPreservation: preserveLayout,
      });

      if (result.error) {
        console.error('OCR Extraction returned error:', result.error);
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: result.error,
        });
      } else {
        setExtractedText(result.extractedText ?? '');
      }
    } catch (err) {
      console.error('Unexpected error during document text extraction:', err);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while processing the document.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (format: 'txt' | 'docx') => {
    if (extractedText === null) return;
    try {
      const blob = new Blob([extractedText], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `swiftscan-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error downloading .${format} file:`, err);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: `Failed to download extracted text as .${format}.`,
      });
    }
  };

  const currentPreview = activeTab === 'url' ? imageUrl : imageDataUri;

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Source</CardTitle>
              <CardDescription>
                Upload a file, capture with your camera, or enter an image URL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(val) => {
                  if (activeTab === 'camera' && val !== 'camera') {
                    stopCamera();
                  }
                  setActiveTab(val);
                  if (val === 'camera' && !imageDataUri && !isCameraActive) {
                    startCamera();
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="camera">
                    <Camera className="mr-2 h-4 w-4" /> Camera
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <Link className="mr-2 h-4 w-4" /> URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    className={cn(
                      'mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                      isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <Label htmlFor="file-upload" className="mt-4 text-center cursor-pointer">
                      <span className="font-semibold text-primary">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider">
                      Or use device camera
                    </span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveTab('camera');
                      startCamera();
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 border-primary/40 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
                  >
                    <Camera className="h-4 w-4 text-primary" />
                    Take Photo with Camera
                  </Button>

                  {fileName && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      File: {fileName}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="camera" className="mt-4 space-y-4">
                  {isCameraActive ? (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-[4/3] flex items-center justify-center shadow-inner">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder overlay guide */}
                      <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-white/60 rounded pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between text-xs text-white/90 font-mono drop-shadow">
                          <span>┌ DOCUMENT SCAN</span>
                          <span>┐</span>
                        </div>
                        <p className="text-center text-xs text-white/95 bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm self-center">
                          Align document within frame
                        </p>
                        <div className="flex justify-between text-xs text-white/90 font-mono drop-shadow">
                          <span>└</span>
                          <span>┘</span>
                        </div>
                      </div>

                      {/* Control buttons over camera */}
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 px-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={switchCamera}
                          title="Flip camera"
                          className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="default"
                          onClick={capturePhoto}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-5 shadow-lg flex items-center gap-2"
                        >
                          <Camera className="h-5 w-5" />
                          Capture Photo
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={stopCamera}
                          title="Close camera"
                          className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center space-y-4 bg-muted/20">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-base">Capture with Camera</h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Point your device camera directly at your document, receipt, or paper to scan it.
                        </p>
                      </div>

                      {cameraError && (
                        <div className="p-3 text-xs rounded bg-destructive/10 text-destructive text-center max-w-sm">
                          {cameraError}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                        <Button
                          type="button"
                          onClick={() => startCamera()}
                          disabled={cameraLoading}
                          className="flex-1 bg-accent hover:bg-accent/90"
                        >
                          {cameraLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Accessing Camera...
                            </>
                          ) : (
                            <>
                              <Camera className="mr-2 h-4 w-4" />
                              {imageDataUri ? 'Retake Photo' : 'Open Camera'}
                            </>
                          )}
                        </Button>
                      </div>

                      {fileName && imageDataUri && (
                        <p className="text-xs text-muted-foreground">
                          Captured document: <span className="font-medium text-foreground">{fileName}</span>
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url">
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="image-url">Image URL</Label>
                    <Input
                      id="image-url"
                      type="text"
                      placeholder="https://example.com/image.png"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="preserve-layout"
                  checked={preserveLayout}
                  onCheckedChange={(checked) =>
                    setPreserveLayout(checked as boolean)
                  }
                />
                <Label
                  htmlFor="preserve-layout"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Attempt to preserve original layout
                </Label>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="w-full mt-6 bg-accent hover:bg-accent/90"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSignature className="mr-2 h-4 w-4" />
                )}
                Scan Document
              </Button>
            </CardContent>
          </Card>
          {currentPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Image Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Image
                  src={currentPreview}
                  alt="Image preview"
                  width={400}
                  height={400}
                  className="rounded-md object-contain max-h-[400px]"
                  data-ai-hint="document photo"
                  referrerPolicy="no-referrer"
                  unoptimized={currentPreview.startsWith('http')}
                  onError={(e) => {
                    console.error('Failed to load image preview:', currentPreview, e);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
        <div>
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle>Extracted Raw Text</CardTitle>
              <CardDescription>
                Scrollable view of the raw text extracted from the document after AI processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollableRawTextArea
                rawText={extractedText}
                isProcessing={isProcessing}
                onTextChange={setExtractedText}
                onDownload={handleDownload}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
