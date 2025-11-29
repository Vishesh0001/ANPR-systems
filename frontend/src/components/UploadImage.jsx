import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '@/lib/api';

const UploadImage = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('cameraId', 1);

            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);

            if (response.data.success && onUploadSuccess) {
                onUploadSuccess(response.data);
            }
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.error || 'Upload failed. Please try again.',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Image for Detection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        {file && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                disabled={uploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {preview && (
                        <div className="relative w-full h-48 bg-muted rounded overflow-hidden">
                            <img
                                src={preview}
                                alt="Preview"
                                className="object-contain w-full h-full"
                            />
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full"
                    >
                        {uploading ? 'Processing...' : 'Detect Plate'}
                    </Button>
                </div>

                {result && (
                    <Alert variant={result.success && result.blacklistFlag ? 'destructive' : 'default'}>
                        {result.success && result.blacklistFlag ? (
                            <AlertTriangle className="h-4 w-4" />
                        ) : result.success ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : null}
                        <AlertTitle>
                            {result.success ? 'Detection Result' : 'Error'}
                        </AlertTitle>
                        <AlertDescription>
                            {result.message}
                            {result.success && result.plateNumber && (
                                <div className="mt-2 font-bold text-lg">
                                    Plate: {result.plateNumber}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default UploadImage;
